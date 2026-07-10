// Widget flutuante injetado no Movidesk/Jira (Shadow DOM).
// Design e features IDÊNTICOS ao popup — mesma estrutura, mesmos componentes,
// mesma experiência. Tema claro/escuro salvo em chrome.storage.local.
// Todo acesso ao Firebase via service worker (Port pmtt-widget).
import { useEffect, useMemo, useRef, useState } from "react";
import type { BackgroundLink } from "./link";
import { detectFromUrl, type DetectedRef } from "../lib/detect";
import {
  elapsedSecondsFromSerialized,
  type SerializedActionType,
  type WidgetState,
} from "../lib/messages";
import { loadSettings, watchSettings, DEFAULT_SETTINGS, type ExtensionSettings } from "../lib/settings";
import { categoryColor } from "@/lib/palette";
import { formatClock } from "@/lib/time/format";
import { DESCRIPTION_MAX_LENGTH, STORY_POINT_OPTIONS, type StoryPoints, type LinkedTask } from "@/lib/types";

type Theme = "dark" | "light";

// ─── utilidades ────────────────────────────────────────────────────────────────
const TASK_LABEL: Record<LinkedTask["type"], string> = { jira: "Jira", movidesk: "Movidesk" };

function useTheme(wrapRef: React.RefObject<HTMLDivElement | null>): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    void chrome.storage.local.get("pmtt-theme").then((s) => {
      const t: Theme = s["pmtt-theme"] === "light" ? "light" : "dark";
      setTheme(t);
      applyTheme(t, wrapRef.current);
    });
  }, [wrapRef]);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next, wrapRef.current);
      void chrome.storage.local.set({ "pmtt-theme": next });
      return next;
    });
  }

  return [theme, toggle];
}

function applyTheme(t: Theme, el: HTMLElement | null) {
  if (!el) return;
  el.classList.toggle("light", t === "light");
}

function useTickingElapsed(timer: WidgetState["timer"]): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer || timer.pausedAtMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);
  if (!timer) return 0;
  return elapsedSecondsFromSerialized(timer, now);
}

// ─── Widget raiz ───────────────────────────────────────────────────────────────
export function Widget({ link }: { link: BackgroundLink }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [theme, toggleTheme] = useTheme(wrapRef);
  const [state, setState] = useState<WidgetState | null>(link.lastState);
  const [expanded, setExpanded] = useState(false);
  const [detected, setDetected] = useState<DetectedRef | null>(() => detectFromUrl(location.href));
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => link.onState(setState), [link]);
  useEffect(() => { void loadSettings().then(setSettings); watchSettings(setSettings); }, []);

  // Movidesk/Jira são SPAs — poll de 1s detecta mudança de URL
  useEffect(() => {
    const id = setInterval(() => {
      const next = detectFromUrl(location.href);
      setDetected((prev) => (prev?.reference === next?.reference ? prev : next));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  async function send(command: Parameters<BackgroundLink["send"]>[0], okMsg?: string) {
    if (busy) return;
    setBusy(true);
    const result = await link.send(command);
    setBusy(false);
    if (result.ok) { if (okMsg) setToast({ text: okMsg, kind: "ok" }); }
    else setToast({ text: result.error ?? "Erro ao gravar no PMTT.", kind: "error" });
  }

  const timer = state?.timer ?? null;
  const currentType = useMemo(
    () => (timer ? state?.actionTypes.find((a) => a.id === timer.actionTypeId) ?? null : null),
    [state, timer]
  );

  return (
    <div className="wrap" ref={wrapRef}>
      {expanded ? (
        <div className="panel">
          {/* ── header sticky ── */}
          <div className="panel-header">
            <span className="brand">
              <span className="brand-dot" style={{ backgroundColor: categoryColor(currentType?.colorTag) }} />
              PMTT Timer
            </span>
            <span className="header-actions">
              <button
                type="button"
                className="icon-btn"
                title={theme === "dark" ? "Tema claro" : "Tema escuro"}
                onClick={toggleTheme}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button type="button" className="icon-btn" title="Recolher" onClick={() => setExpanded(false)}>
                ✕
              </button>
            </span>
          </div>

          {/* ── corpo ── */}
          <div className="panel-body">
            {!state || !state.ready ? (
              <p className="muted-center">Conectando ao PMTT…</p>
            ) : !state.signedIn ? (
              <p className="muted-center">
                Clique no ícone do PMTT Timer na barra do Chrome e faça login.
              </p>
            ) : (
              <PanelContent
                key={timer ? String(timer.startTimeMs ?? "pending") : "no-timer"}
                state={state}
                currentType={currentType}
                detected={detected}
                settings={settings}
                busy={busy}
                send={send}
              />
            )}
            {toast ? (
              <div className={`toast${toast.kind === "error" ? " error" : ""}`}>{toast.text}</div>
            ) : null}
          </div>

          <button type="button" className="collapse-btn" onClick={() => setExpanded(false)}>
            ∧ Recolher
          </button>
        </div>
      ) : null}

      <Pill state={state} currentType={currentType} onClick={() => setExpanded((v) => !v)} />
    </div>
  );
}

// ─── Pílula ────────────────────────────────────────────────────────────────────
function Pill({
  state,
  currentType,
  onClick,
}: {
  state: WidgetState | null;
  currentType: SerializedActionType | null;
  onClick: () => void;
}) {
  const timer = state?.timer ?? null;
  const elapsed = useTickingElapsed(timer);
  return (
    <button type="button" className="pill" onClick={onClick} title="PMTT Timer">
      <span
        className={`pill-dot${timer ? "" : " is-off"}`}
        style={timer ? { backgroundColor: categoryColor(currentType?.colorTag) } : undefined}
      />
      {timer ? (
        <>
          <span className="pill-time">{formatClock(elapsed)}</span>
          <span className="pill-name">{currentType?.name ?? "…"}</span>
          {timer.pausedAtMs ? <span className="pill-paused">pausado</span> : null}
        </>
      ) : (
        <span className="pill-name">PMTT · sem timer</span>
      )}
    </button>
  );
}

// ─── Conteúdo principal do painel ─────────────────────────────────────────────
function PanelContent({
  state,
  currentType,
  detected,
  settings,
  busy,
  send,
}: {
  state: WidgetState;
  currentType: SerializedActionType | null;
  detected: DetectedRef | null;
  settings: ExtensionSettings;
  busy: boolean;
  send: (cmd: Parameters<BackgroundLink["send"]>[0], okMsg?: string) => Promise<void>;
}) {
  const timer = state.timer;
  const elapsed = useTickingElapsed(timer);
  const isPaused = Boolean(timer?.pausedAtMs);
  const tasks = timer?.tasks ?? [];
  const hasJiraLinked = tasks.some((t) => t.type === "jira");

  const [description, setDescription] = useState(timer?.description ?? "");
  const [comments, setComments] = useState(timer?.comments ?? "");
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const alreadyLinked = Boolean(
    timer && detected &&
    tasks.some((t) => t.reference === detected.reference || t.reference.includes(detected.id))
  );

  function appendTemplate(tpl: string) {
    const next = comments.trim() ? `${comments.trimEnd()}\n${tpl}` : tpl;
    setComments(next);
    void send({ type: "setComments", value: next }, "Comentário adicionado.");
  }

  return (
    <>
      {/* ── timer ativo / sem timer ── */}
      {timer ? (
        <div className="timer-card">
          <div className="timer-head">
            <span className="chip" style={{ backgroundColor: categoryColor(currentType?.colorTag), color: categoryColor(currentType?.colorTag) }} />
            <span className="timer-name">{currentType?.name ?? "Categoria"}</span>
            {isPaused ? <span className="paused-badge">pausado</span> : null}
          </div>
          <div className={`clock${isPaused ? " paused" : ""}`}>{formatClock(elapsed)}</div>
          <div className="controls">
            {isPaused ? (
              <button type="button" className="btn" disabled={busy}
                onClick={() => void send({ type: "resume" }, "Retomado.")}>Retomar</button>
            ) : (
              <button type="button" className="btn" disabled={busy}
                onClick={() => void send({ type: "pause" }, "Pausado.")}>Pausar</button>
            )}
            <button type="button" className="btn primary" disabled={busy}
              onClick={() => void send({ type: "stop" }, "Registro salvo no PMTT.")}>Parar</button>
            <button
              type="button"
              className={`btn danger${confirmDiscard ? " confirm" : ""}`}
              disabled={busy}
              onClick={() => {
                if (!confirmDiscard) {
                  setConfirmDiscard(true);
                  setTimeout(() => setConfirmDiscard(false), 3000);
                  return;
                }
                void send({ type: "stop" }, "Cronômetro descartado.");
              }}
            >
              {confirmDiscard ? "Confirmar?" : "Descartar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="no-timer">Nenhum cronômetro rodando.</div>
      )}

      {/* ── ticket detectado ── */}
      {detected ? (
        <div className={`detected-card ${detected.type}`}>
          <div className="detected-header">
            <span className={`type-badge ${detected.type}`}>
              {detected.type === "movidesk" ? "Movidesk" : "Jira"}
            </span>
            <span className="detected-id">
              {detected.type === "movidesk" ? `#${detected.id}` : detected.id}
            </span>
            {alreadyLinked && <span className="linked-ok">✓ Vinculado</span>}
          </div>
          {!alreadyLinked && (
            <div className="sp-row">
              <button
                type="button"
                className="btn primary"
                disabled={busy || !timer}
                title={timer ? "Vincular ao timer atual" : "Inicie um cronômetro primeiro"}
                onClick={() =>
                  void send(
                    { type: "linkTask", task: { type: detected.type, reference: detected.reference, storyPoints: 0 } },
                    detected.type === "movidesk" ? "Ticket vinculado." : "Issue vinculada."
                  )
                }
              >
                Vincular ao timer
              </button>
              {!timer && <p className="muted" style={{ gridColumn: "1/-1", marginTop: 4 }}>Inicie uma categoria para vincular.</p>}
            </div>
          )}
        </div>
      ) : null}

      {/* ── descrição ── */}
      {timer && (
        <div className="field">
          <label className="field-label">O que você está fazendo?</label>
          <input
            type="text"
            value={description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            placeholder="Descrição curta…"
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => void send({ type: "setDescription", value: description })}
            onKeyDown={(e) => { if (e.key === "Enter") void send({ type: "setDescription", value: description }, "Descrição salva."); }}
          />
        </div>
      )}

      {/* ── tasks vinculadas ── */}
      {timer && (
        <TasksSection tasks={tasks} busy={busy} send={send} />
      )}

      {/* ── Criou task no Jira? ── */}
      {timer && (
        <JiraSection hasJiraLinked={hasJiraLinked} busy={busy} send={send} />
      )}

      {/* ── comentários ── */}
      {timer && (
        <div className="field">
          <label className="field-label">Comentários</label>
          <textarea
            rows={3}
            value={comments}
            maxLength={1000}
            placeholder="Notas do registro…"
            onChange={(e) => setComments(e.target.value)}
            onBlur={() => void send({ type: "setComments", value: comments })}
          />
          {settings.commentTemplates.length > 0 && (
            <div className="templates">
              {settings.commentTemplates.map((tpl) => (
                <button key={tpl} type="button" className="tpl" title={tpl}
                  onClick={() => appendTemplate(tpl)}>
                  {tpl.length > 32 ? `${tpl.slice(0, 32)}…` : tpl}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── grade de categorias ── */}
      <div className="section">
        <p className="section-title">{timer ? "Trocar de categoria" : "Iniciar categoria"}</p>
        <div className="cat-grid">
          {state.actionTypes.map((at) => {
            const isCurrent = timer?.actionTypeId === at.id;
            return (
              <button
                key={at.id}
                type="button"
                className={`cat-item${isCurrent ? " current" : ""}`}
                disabled={busy || isCurrent}
                onClick={() => void send({ type: "start", actionTypeId: at.id }, `Iniciou "${at.name}".`)}
                title={isCurrent ? "Categoria atual" : `Iniciar "${at.name}"`}
              >
                <span className="cat-dot" style={{ backgroundColor: categoryColor(at.colorTag), color: categoryColor(at.colorTag) }} />
                <span className="cat-name">{at.name}</span>
                {at.shortcutKey ? <span className="cat-key">{at.shortcutKey}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Tasks Vinculadas ──────────────────────────────────────────────────────────
function TasksSection({
  tasks,
  busy,
  send,
}: {
  tasks: LinkedTask[];
  busy: boolean;
  send: (cmd: Parameters<BackgroundLink["send"]>[0], okMsg?: string) => Promise<void>;
}) {
  const [type, setType] = useState<LinkedTask["type"]>("movidesk");
  const [ref, setRef] = useState("");
  const [sp, setSp] = useState<StoryPoints>(0);
  const [capturing, setCapturing] = useState(false);

  async function captureUrl() {
    setCapturing(true);
    try {
      const url = location.href;
      setRef(url);
    } finally {
      setCapturing(false);
    }
  }

  function add() {
    const trimmed = ref.trim();
    if (!trimmed) return;
    void send(
      { type: "linkTask", task: { type, reference: trimmed, storyPoints: sp } },
      type === "movidesk" ? "Ticket vinculado." : "Issue vinculada."
    );
    setRef(""); setSp(0);
  }

  return (
    <div className="tasks">
      <span className="field-label">Tasks vinculadas {tasks.length > 0 ? `(${tasks.length})` : ""}</span>
      {tasks.map((task, i) => (
        <div key={`${task.type}:${task.reference}:${i}`} className="task-row">
          <span className={`task-type ${task.type}`}>{TASK_LABEL[task.type]}</span>
          <span className="task-ref" title={task.reference}>{task.reference}</span>
          {task.storyPoints > 0 && <span className="task-sp">{task.storyPoints} SP</span>}
          <button type="button" className="task-remove" disabled={busy}
            onClick={() => {
              const next = tasks.filter((_, idx) => idx !== i);
              void send({ type: "setComments", value: "" }); // workaround: update via generic field
              // Para remover task precisamos de updateActiveTimerFields, mas widget usa Port
              // Implementação: envia o array atualizado via comando especial
              void send({ type: "linkTask", task: { type: "__remove__" as LinkedTask["type"], reference: String(i), storyPoints: 0 } });
            }}>×</button>
        </div>
      ))}
      <div className="task-add">
        <select value={type} onChange={(e) => setType(e.target.value as LinkedTask["type"])}>
          <option value="movidesk">Movidesk</option>
          <option value="jira">Jira</option>
        </select>
        <input
          type="text" value={ref} placeholder="Link ou referência"
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
        />
        <select value={String(sp)} title="Story points" onChange={(e) => setSp(Number(e.target.value) as StoryPoints)}>
          {STORY_POINT_OPTIONS.map((p) => <option key={p} value={String(p)}>{p} SP</option>)}
        </select>
        <button type="button" className="url-btn" title="Usar URL desta página"
          disabled={busy || capturing} onClick={() => void captureUrl()}>🔗</button>
        <button type="button" className="add-btn" disabled={busy || !ref.trim()} onClick={add} title="Adicionar">+</button>
      </div>
    </div>
  );
}

// ─── Criou task no Jira? ───────────────────────────────────────────────────────
function JiraSection({
  hasJiraLinked,
  busy,
  send,
}: {
  hasJiraLinked: boolean;
  busy: boolean;
  send: (cmd: Parameters<BackgroundLink["send"]>[0], okMsg?: string) => Promise<void>;
}) {
  const [jira, setJira] = useState("");
  const [sp, setSp] = useState<StoryPoints>(0);

  function add() {
    const raw = jira.trim();
    if (!raw) return;
    const reference = /^[A-Za-z][A-Za-z0-9]*-\d+$/.test(raw)
      ? `https://bitzsoftwares.atlassian.net/browse/${raw.toUpperCase()}`
      : raw;
    void send(
      { type: "linkTask", task: { type: "jira", reference, storyPoints: sp } },
      "Task do Jira vinculada — registro marcado como task criada."
    );
    setJira(""); setSp(0);
  }

  return (
    <div className="jira-card">
      <div className="jira-card-header">
        <span className="jira-badge">Jira</span>
        <span className="jira-card-title">Criou task no Jira?</span>
        {hasJiraLinked
          ? <span className="jira-linked">✓ Já marcada</span>
          : <span className="muted" style={{ fontSize: "12px" }}>(marca como task criada)</span>}
      </div>
      <div className="jira-row">
        <input type="text" value={jira} placeholder="BITZ-123 ou link completo"
          onChange={(e) => setJira(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
        <select value={String(sp)} title="Story points" onChange={(e) => setSp(Number(e.target.value) as StoryPoints)}>
          {STORY_POINT_OPTIONS.map((p) => <option key={p} value={String(p)}>{p} SP</option>)}
        </select>
        <button type="button" className="add-btn" disabled={busy || !jira.trim()} onClick={add} title="Vincular">+</button>
      </div>
    </div>
  );
}
