// Service worker (MV3) da extensão PMTT Timer. Responsabilidades:
//  1. Manter badge do ícone com o tempo decorrido (verde rodando/âmbar pausado).
//  2. Servir estado em tempo real ao widget do Movidesk/Jira via Port e
//     executar os comandos dele no Firestore (o content script não fala
//     Firebase — ver lib/messages.ts).
//  3. Regras por domínio: ao trocar de aba/URL, sugerir troca de categoria via
//     notificação com botão de um clique. Nunca troca sozinha.
//
// Service workers MV3 dormem após ~30s ociosos e os onSnapshot morrem junto.
// Todo o estado aqui é reconstruível: o topo deste arquivo roda de novo a cada
// despertar (evento de aba, port do widget, alarme de 1 min do badge) e
// religa auth + snapshots. Nada de top-level await — MV3 não registra os
// listeners a tempo se o script suspender no carregamento.
import { onAuthStateChanged, type User } from "firebase/auth/web-extension";
import { collection, doc, getDoc, getDocs, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { ActionType, ActiveTimer } from "@/lib/types";
import {
  addLinkedTask,
  computeElapsedMs,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  updateActiveTimerFields,
} from "../lib/timer-ops";
import {
  WIDGET_PORT_NAME,
  serializeActionType,
  serializeTimer,
  type BackgroundMessage,
  type WidgetCommand,
  type WidgetState,
} from "../lib/messages";
import { BADGE_COLOR_PAUSED, BADGE_COLOR_RUNNING, badgeText } from "../lib/badge";
import { loadSettings, urlMatchesPattern, type DomainRule } from "../lib/settings";

// ---------------------------------------------------------------------------
// Estado em memória (reconstruído a cada despertar do service worker)
// ---------------------------------------------------------------------------

let currentUser: User | null = null;
let authKnown = false;
let activeTimer: ActiveTimer | null = null;
let timerLoaded = false;
let actionTypes: ActionType[] = [];
let actionTypesLoaded = false;
let unsubTimer: Unsubscribe | null = null;
let unsubActionTypes: Unsubscribe | null = null;

const widgetPorts = new Set<chrome.runtime.Port>();

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authKnown = true;
  resubscribe();
  broadcastState();
  void updateBadge();
});

function resubscribe() {
  unsubTimer?.();
  unsubActionTypes?.();
  unsubTimer = null;
  unsubActionTypes = null;
  activeTimer = null;
  timerLoaded = false;
  actionTypes = [];
  actionTypesLoaded = false;

  if (!currentUser) return;
  const uid = currentUser.uid;

  unsubTimer = onSnapshot(doc(db, "users", uid, "activeTimer", "current"), (snap) => {
    activeTimer = snap.exists() ? (snap.data() as ActiveTimer) : null;
    timerLoaded = true;
    broadcastState();
    void updateBadge();
  });

  unsubActionTypes = onSnapshot(collection(db, "users", uid, "actionTypes"), (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActionType);
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "pt-BR"));
    actionTypes = items;
    actionTypesLoaded = true;
    broadcastState();
  });
}

/** Timer atual, buscando direto do servidor se o snapshot ainda não chegou
 * (comando do widget logo após o service worker acordar). */
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
// Ports do widget (content script no Movidesk/Jira)
// ---------------------------------------------------------------------------

function buildWidgetState(): WidgetState {
  return {
    ready: authKnown && (!currentUser || (timerLoaded && actionTypesLoaded)),
    signedIn: Boolean(currentUser),
    timer: activeTimer ? serializeTimer(activeTimer) : null,
    actionTypes: actionTypes.filter((a) => !a.archived).map(serializeActionType),
  };
}

function broadcastState() {
  const message: BackgroundMessage = { type: "state", state: buildWidgetState() };
  for (const port of widgetPorts) {
    try {
      port.postMessage(message);
    } catch {
      widgetPorts.delete(port);
    }
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== WIDGET_PORT_NAME) return;
  widgetPorts.add(port);
  port.onDisconnect.addListener(() => widgetPorts.delete(port));
  port.onMessage.addListener((message: WidgetCommand) => {
    void handleCommand(port, message);
  });
  port.postMessage({ type: "state", state: buildWidgetState() } satisfies BackgroundMessage);
});

async function handleCommand(port: chrome.runtime.Port, command: WidgetCommand) {
  const ack = (ok: boolean, error?: string) => {
    try {
      port.postMessage({ type: "ack", commandType: command.type, ok, error } satisfies BackgroundMessage);
    } catch {
      // Porta fechou enquanto executávamos — o estado chega pelo próximo connect.
    }
  };

  try {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
      ack(false, "Entre na extensão pelo popup para usar o widget.");
      return;
    }
    await executeCommand(user.uid, command);
    ack(true);
  } catch (error) {
    ack(false, error instanceof Error ? error.message : "Erro inesperado ao gravar no PMTT.");
  }
}

async function executeCommand(uid: string, command: WidgetCommand) {
  const timer = await getFreshTimer(uid);

  switch (command.type) {
    case "start": {
      const types = await getFreshActionTypes(uid);
      let current: { timer: ActiveTimer; actionTypeName: string } | null = null;
      if (timer) {
        const previousType = types.find((t) => t.id === timer.actionTypeId);
        current = { timer, actionTypeName: previousType?.name ?? "Categoria" };
      }
      await startTimer(db, uid, command.actionTypeId, current);
      return;
    }
    case "pause": {
      if (!timer) throw new Error("Nenhum cronômetro ativo.");
      await pauseTimer(db, uid, timer);
      return;
    }
    case "resume": {
      if (!timer) throw new Error("Nenhum cronômetro ativo.");
      await resumeTimer(db, uid, timer);
      return;
    }
    case "stop": {
      if (!timer) throw new Error("Nenhum cronômetro ativo.");
      const types = await getFreshActionTypes(uid);
      const actionTypeName = types.find((t) => t.id === timer.actionTypeId)?.name ?? "Categoria";
      await stopTimer(db, uid, timer, actionTypeName);
      return;
    }
    case "linkTask": {
      if (!timer) throw new Error("Inicie um cronômetro antes de vincular a task.");
      await addLinkedTask(db, uid, timer, command.task);
      return;
    }
    case "setDescription": {
      if (!timer) throw new Error("Nenhum cronômetro ativo.");
      await updateActiveTimerFields(db, uid, { description: command.value });
      return;
    }
    case "setComments": {
      if (!timer) throw new Error("Nenhum cronômetro ativo.");
      await updateActiveTimerFields(db, uid, { comments: command.value });
      return;
    }
  }
}

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

async function evaluateDomainRules(tab: chrome.tabs.Tab) {
  const url = tab.url;
  if (!url || !/^https?:\/\//.test(url)) return;

  const settings = await loadSettings();
  const rule = settings.domainRules.find((r) => r.notify && urlMatchesPattern(url, r.pattern));
  if (!rule) return;

  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return;

  // Já está na categoria certa? Nada a sugerir.
  const timer = await getFreshTimer(user.uid);
  if (timer && timer.actionTypeId === rule.actionTypeId) return;

  if (await isOnCooldown(rule)) return;

  const hostname = new URL(url).hostname;
  chrome.notifications.create(`pmtt-rule:${rule.id}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "PMTT Timer",
    message: timer
      ? `Você está em ${hostname}, mas o cronômetro está em outra categoria. Trocar para "${rule.actionTypeName}"?`
      : `Você está em ${hostname} sem cronômetro rodando. Iniciar "${rule.actionTypeName}"?`,
    buttons: [{ title: `Iniciar "${rule.actionTypeName}"` }, { title: "Ignorar" }],
    priority: 1,
  });
  await markNotified(rule);
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

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  void (async () => {
    chrome.notifications.clear(notificationId);
    if (!notificationId.startsWith("pmtt-rule:") || buttonIndex !== 0) return;

    const ruleId = notificationId.slice("pmtt-rule:".length);
    const settings = await loadSettings();
    const rule = settings.domainRules.find((r) => r.id === ruleId);
    if (!rule) return;

    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) return;
    await executeCommand(user.uid, { type: "start", actionTypeId: rule.actionTypeId });
  })();
});

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});
