// Service worker (MV3) da extensão PMTT Timer. Responsabilidades:
//  1. Manter badge do ícone com o tempo decorrido (verde rodando/âmbar pausado).
//  2. Regras por domínio: ao trocar de aba/URL, sugerir troca de categoria via
//     notificação com botão de um clique. Nunca troca sozinha.
//
// Service workers MV3 dormem após ~30s ociosos e os onSnapshot morrem junto.
// Todo o estado aqui é reconstruível: o topo deste arquivo roda de novo a cada
// despertar (evento de aba, alarme de 1 min do badge) e religa auth +
// snapshots. Nada de top-level await — MV3 não registra os listeners a tempo
// se o script suspender no carregamento.
import { onAuthStateChanged, type User } from "firebase/auth/web-extension";
import { collection, doc, getDoc, getDocs, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { ActionType, ActiveTimer } from "@/lib/types";
import { computeElapsedMs, startTimer } from "../lib/timer-ops";
import { BADGE_COLOR_PAUSED, BADGE_COLOR_RUNNING, badgeText } from "../lib/badge";
import { loadSettings, urlMatchesPattern, type DomainRule } from "../lib/settings";

// ---------------------------------------------------------------------------
// Estado em memória (reconstruído a cada despertar do service worker)
// ---------------------------------------------------------------------------

let currentUser: User | null = null;
let activeTimer: ActiveTimer | null = null;
let timerLoaded = false;
let actionTypes: ActionType[] = [];
let actionTypesLoaded = false;
let unsubTimer: Unsubscribe | null = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  resubscribe();
  void updateBadge();
});

function resubscribe() {
  unsubTimer?.();
  unsubTimer = null;
  activeTimer = null;
  timerLoaded = false;
  actionTypes = [];
  actionTypesLoaded = false;

  if (!currentUser) return;
  const uid = currentUser.uid;

  unsubTimer = onSnapshot(doc(db, "users", uid, "activeTimer", "current"), (snap) => {
    activeTimer = snap.exists() ? (snap.data() as ActiveTimer) : null;
    timerLoaded = true;
    void updateBadge();
  });
}

/** Timer atual, buscando direto do servidor se o snapshot ainda não chegou
 * (ex.: clique na notificação logo após o service worker acordar). */
async function getFreshTimer(uid: string): Promise<ActiveTimer | null> {
  if (timerLoaded) return activeTimer;
  const snap = await getDoc(doc(db, "users", uid, "activeTimer", "current"));
  return snap.exists() ? (snap.data() as ActiveTimer) : null;
}

async function getFreshActionTypes(uid: string): Promise<ActionType[]> {
  if (actionTypesLoaded) return actionTypes;
  const snapshot = await getDocs(collection(db, "users", uid, "actionTypes"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActionType);
}

// ---------------------------------------------------------------------------
// Badge do ícone
// ---------------------------------------------------------------------------

async function updateBadge() {
  if (!currentUser || !activeTimer) {
    await chrome.action.setBadgeText({ text: "" });
    return;
  }
  const elapsedSeconds = Math.floor(computeElapsedMs(activeTimer, Date.now()) / 1000);
  const paused = Boolean(activeTimer.pausedAt);
  await chrome.action.setBadgeBackgroundColor({
    color: paused ? BADGE_COLOR_PAUSED : BADGE_COLOR_RUNNING,
  });
  await chrome.action.setBadgeTextColor({ color: "#ffffff" });
  await chrome.action.setBadgeText({ text: badgeText(elapsedSeconds) });
}

// Alarme de 1 min: acorda o service worker para o badge não congelar quando os
// snapshots morrem. Ao acordar, o topo do arquivo já religou os listeners; o
// updateBadge aqui cobre o intervalo até o snapshot chegar.
chrome.alarms.create("pmtt-badge", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pmtt-badge") void updateBadge();
});

// ---------------------------------------------------------------------------
// Regras por domínio → notificações de troca de categoria
// ---------------------------------------------------------------------------

chrome.tabs.onActivated.addListener((activeInfo) => {
  void chrome.tabs
    .get(activeInfo.tabId)
    .then((tab) => evaluateDomainRules(tab))
    .catch(() => undefined);
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (!tab.active) return;
  if (!changeInfo.url && changeInfo.status !== "complete") return;
  void evaluateDomainRules(tab);
});

// Regras já em avaliação neste despertar do service worker. onActivated e
// onUpdated disparam quase juntos na mesma navegação; sem esta trava os dois
// passam pelo cooldown antes do primeiro gravá-lo e a notificação duplica.
const evaluatingRules = new Set<string>();

async function evaluateDomainRules(tab: chrome.tabs.Tab) {
  const url = tab.url;
  if (!url || !/^https?:\/\//.test(url)) return;

  const settings = await loadSettings();
  const rule = settings.domainRules.find((r) => r.notify && urlMatchesPattern(url, r.pattern));
  if (!rule) return;

  if (evaluatingRules.has(rule.id)) return;
  evaluatingRules.add(rule.id);
  try {
    await notifyRuleIfDue(rule, url, settings.notifyWhileRunning);
  } finally {
    evaluatingRules.delete(rule.id);
  }
}

async function notifyRuleIfDue(rule: DomainRule, url: string, notifyWhileRunning: boolean) {
  // Cooldown primeiro: é o filtro mais barato e o que segura o flood.
  if (await isOnCooldown(rule)) return;

  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return;

  const timer = await getFreshTimer(user.uid);
  // Já está na categoria certa? Nada a sugerir.
  if (timer && timer.actionTypeId === rule.actionTypeId) return;
  // Cronômetro rodando em outra categoria: só interrompe se o usuário pediu.
  if (timer && !notifyWhileRunning) return;

  // Marca o cooldown ANTES de criar — se outro evento chegar no meio, ele
  // já encontra o cooldown ativo e não duplica a notificação.
  await markNotified(rule);

  const hostname = new URL(url).hostname;
  chrome.notifications.create(`pmtt-rule:${rule.id}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: `Iniciar "${rule.actionTypeName}"?`,
    message: timer
      ? `Você está em ${hostname} com o cronômetro em outra categoria.`
      : `Você está em ${hostname} sem cronômetro rodando.`,
    buttons: [{ title: `Iniciar "${rule.actionTypeName}"` }, { title: "Silenciar por hoje" }],
    priority: 0,
  });
}

/** Inicia (ou troca para) a categoria da regra, parando o timer atual se houver. */
async function startFromRule(uid: string, rule: DomainRule) {
  const timer = await getFreshTimer(uid);
  let current: { timer: ActiveTimer; actionTypeName: string } | null = null;
  if (timer) {
    const types = await getFreshActionTypes(uid);
    const previousType = types.find((t) => t.id === timer.actionTypeId);
    current = { timer, actionTypeName: previousType?.name ?? "Categoria" };
  }
  await startTimer(db, uid, rule.actionTypeId, current);
}

/** Cooldown por regra em chrome.storage.session — sobrevive ao sono do service
 * worker, mas zera quando o navegador fecha (de propósito: novo dia, novo aviso). */
async function isOnCooldown(rule: DomainRule): Promise<boolean> {
  const key = `cooldown:${rule.id}`;
  const stored = await chrome.storage.session.get(key);
  const lastMs = stored[key] as number | undefined;
  const cooldownMs = Math.max(1, rule.cooldownMinutes || 15) * 60_000;
  return typeof lastMs === "number" && Date.now() - lastMs < cooldownMs;
}

async function markNotified(rule: DomainRule) {
  await chrome.storage.session.set({ [`cooldown:${rule.id}`]: Date.now() });
}

/** "Ignorar" cala a regra até o navegador fechar: um timestamp no futuro
 * distante deixa o isOnCooldown sempre verdadeiro nesta sessão. */
async function silenceForSession(ruleId: string) {
  await chrome.storage.session.set({ [`cooldown:${ruleId}`]: Number.MAX_SAFE_INTEGER });
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  void (async () => {
    chrome.notifications.clear(notificationId);
    if (!notificationId.startsWith("pmtt-rule:")) return;
    const ruleId = notificationId.slice("pmtt-rule:".length);

    if (buttonIndex === 1) {
      await silenceForSession(ruleId);
      return;
    }

    const settings = await loadSettings();
    const rule = settings.domainRules.find((r) => r.id === ruleId);
    if (!rule) return;

    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) return;
    await startFromRule(user.uid, rule);
  })();
});

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});
