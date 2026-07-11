// Popup da extensão — o cronômetro do PMTT em miniatura: iniciar/trocar
// categoria (com os mesmos atalhos 1–9 do app), pausar, parar, descartar,
// descrição rápida, tasks vinculadas e comentários com templates.
import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import {
  useActionTypesList,
  useActiveTimerDoc,
  useAuthState,
  useElapsedSeconds,
  useExtensionSettings,
  useNotice,
  useSkin,
  useTheme,
} from "../shared/hooks";

import {
  ExternalLink,
  Link2,
  Moon,
  Pause,
  Play,
  Plus,
  Settings,
  Square,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { LoginForm } from "../shared/login-form";
import { CategoryGrid } from "../shared/category-grid";
import { detectFromUrl } from "../lib/detect";
import { PMTT_APP_URL } from "../lib/settings";
import { formatClock, formatDuration } from "@/lib/time/format";
import { categoryColor } from "@/lib/palette";
import {
  DESCRIPTION_MAX_LENGTH,
  STORY_POINT_OPTIONS,
  type ActionType,
  type ActiveTimer,
  type LinkedTask,
  type StoryPoints,
} from "@/lib/types";
import {
  discardTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  updateActiveTimerFields,
  addLinkedTask,
} from "../lib/timer-ops";


export function App() {
  const { user, loading } = useAuthState();
  const { settings } = useExtensionSettings();
  const [theme, toggleTheme] = useTheme();
  useSkin(); // aplica o tema salvo (o seletor vive na página de opções)

  return (
    <div className="pmtt-popup">
      <header className="pmtt-header">
        <span className="pmtt-brand">
          <span className="pmtt-brand-dot" />
          PMTT Timer
        </span>
        <span className="pmtt-header-actions">
          <button
            type="button"
            className="pmtt-icon-btn"
            title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            className="pmtt-icon-btn"
            title="Abrir PMTT"
            onClick={() => chrome.tabs.create({ url: PMTT_APP_URL })}
          >
            <ExternalLink size={16} />
          </button>
          <button
            type="button"
            className="pmtt-icon-btn"
            title="Opções da extensão"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            <Settings size={16} />
          </button>
        </span>
      </header>

      {loading ? (
        <p className="pmtt-muted pmtt-pad">Carregando…</p>
      ) : user ? (
        <SignedIn uid={user.uid} commentTemplates={settings.commentTemplates} />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}


function SignedIn({ uid, commentTemplates }: { uid: string; commentTemplates: string[] }) {
  const { timer, loading: timerLoading } = useActiveTimerDoc(uid);
  const { activeActionTypes, loading: typesLoading } = useActionTypesList(uid);
  const { notice, showOk, showError } = useNotice();
  const [busy, setBusy] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");

  // Com muitas categorias a grade fica longa — um filtro rápido resolve.
  const showCategoryFilter = activeActionTypes.length > 9;
  const visibleActionTypes = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return activeActionTypes;
    return activeActionTypes.filter((a) => a.name.toLowerCase().includes(query));
  }, [activeActionTypes, categoryQuery]);

  const actionTypesById = useMemo(() => {
    const map = new Map<string, ActionType>();
    for (const item of activeActionTypes) map.set(item.id, item);
    return map;
  }, [activeActionTypes]);

  const currentType = timer ? actionTypesById.get(timer.actionTypeId) ?? null : null;

  // A operação retorna a mensagem de sucesso (ou nada, para salvar silencioso).
  async function run(operation: () => Promise<string | void>) {
    if (busy) return;
    setBusy(true);
    try {
      const label = await operation();
      if (label) showOk(label);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao gravar no PMTT.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStart(actionType: ActionType) {
    await run(async () => {
      const current = timer
        ? { timer, actionTypeName: currentType?.name ?? "Categoria" }
        : null;
      const previousDuration = await startTimer(db, uid, actionType.id, current);
      return previousDuration != null
        ? `Parou anterior (${formatDuration(previousDuration)}) · Iniciou "${actionType.name}"`
        : `Iniciou "${actionType.name}"`;
    });
  }

  // Atalhos 1–9 iniciam a categoria correspondente, como no app web.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const digit = Number(event.key);
      if (!Number.isInteger(digit) || digit < 1 || digit > 9) return;
      const match = activeActionTypes.find((a) => a.shortcutKey === digit);
      if (match) void handleStart(match);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeActionTypes, timer, busy]);

  if (timerLoading || typesLoading) {
    return <p className="pmtt-muted pmtt-pad">Carregando…</p>;
  }

  return (
    <div className="pmtt-body">
      {timer ? (
        <TimerSection
          key={timer.startTime ? String(timer.startTime.toMillis()) : "pending"}
          uid={uid}
          timer={timer}
          currentTypeName={currentType?.name ?? "Categoria"}
          currentTypeColor={categoryColor(currentType?.colorTag)}
          commentTemplates={commentTemplates}
          busy={busy}
          run={run}
        />
      ) : (
        <p className="pmtt-empty">Nenhum cronômetro rodando.</p>
      )}

      <section className="pmtt-section">
        <div className="pmtt-section-head">
          <h2 className="pmtt-section-title">
            {timer ? "Trocar de categoria" : "Iniciar categoria"}
          </h2>
          {showCategoryFilter ? (
            <input
              type="search"
              className="pmtt-cat-filter"
              value={categoryQuery}
              placeholder="Filtrar categorias…"
              onChange={(e) => setCategoryQuery(e.target.value)}
            />
          ) : null}
        </div>
        <CategoryGrid
          actionTypes={visibleActionTypes}
          currentActionTypeId={timer?.actionTypeId}
          onSelect={(actionType) => void handleStart(actionType)}
          disabled={busy}
        />
        {visibleActionTypes.length === 0 && categoryQuery ? (
          <p className="pmtt-muted">Nenhuma categoria com "{categoryQuery}".</p>
        ) : null}
      </section>

      {notice ? <div className={`pmtt-toast is-${notice.kind}`}>{notice.text}</div> : null}
    </div>
  );
}

function TimerSection({
  uid,
  timer,
  currentTypeName,
  currentTypeColor,
  commentTemplates,
  busy,
  run,
}: {
  uid: string;
  timer: ActiveTimer;
  currentTypeName: string;
  currentTypeColor: string;
  commentTemplates: string[];
  busy: boolean;
  run: (operation: () => Promise<string | void>) => Promise<void>;
}) {
  const elapsedSeconds = useElapsedSeconds(timer);
  const isPaused = Boolean(timer.pausedAt);
  const [description, setDescription] = useState(timer.description ?? "");
  const [comments, setComments] = useState(timer.comments ?? "");
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const tasks = timer.tasks ?? [];
  const hasJiraLinked = tasks.some((t) => t.type === "jira");


  function saveDescription(value: string) {
    void run(() => updateActiveTimerFields(db, uid, { description: value }));
  }

  function saveComments(value: string) {
    void run(() => updateActiveTimerFields(db, uid, { comments: value }));
  }

  function appendTemplate(template: string) {
    const next = comments.trim() ? `${comments.trimEnd()}\n${template}` : template;
    setComments(next);
    saveComments(next);
  }

  return (
    <section className="pmtt-timer">
      <div className="pmtt-timer-head">
        <span className="pmtt-chip" style={{ backgroundColor: currentTypeColor }} />
        <span className="pmtt-timer-name">{currentTypeName}</span>
        {isPaused ? <span className="pmtt-paused-badge">pausado</span> : null}
      </div>

      <div className={`pmtt-clock${isPaused ? " is-paused" : ""}`}>{formatClock(elapsedSeconds)}</div>

      <div className="pmtt-controls">
        {isPaused ? (
          <button
            type="button"
            className="pmtt-btn"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await resumeTimer(db, uid, timer);
                return "Retomado.";
              })
            }
          >
            <Play size={14} /> Retomar
          </button>
        ) : (
          <button
            type="button"
            className="pmtt-btn"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await pauseTimer(db, uid, timer);
                return "Pausado.";
              })
            }
          >
            <Pause size={14} /> Pausar
          </button>
        )}
        <button
          type="button"
          className="pmtt-btn pmtt-btn-primary"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const duration = await stopTimer(db, uid, timer, currentTypeName);
              return `Parou "${currentTypeName}" (${formatDuration(duration)})`;
            })
          }
        >
          <Square size={13} /> Parar
        </button>
        <button
          type="button"
          className={`pmtt-btn pmtt-btn-danger${confirmDiscard ? " is-confirm" : ""}`}
          disabled={busy}
          onClick={() => {
            if (!confirmDiscard) {
              setConfirmDiscard(true);
              setTimeout(() => setConfirmDiscard(false), 3000);
              return;
            }
            void run(async () => {
              await discardTimer(db, uid);
              return "Cronômetro descartado.";
            });
          }}
        >
          {confirmDiscard ? "Confirmar?" : <><Trash2 size={13} /> Descartar</>}
        </button>
      </div>

      <label className="pmtt-field">
        <span>O que você está fazendo?</span>
        <input
          type="text"
          value={description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          placeholder="Descrição curta…"
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => saveDescription(description)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveDescription(description);
          }}
        />
      </label>

      <TasksEditor
        uid={uid}
        tasks={tasks}
        busy={busy}
        onChange={(next) => void run(() => updateActiveTimerFields(db, uid, { tasks: next }))}
        onAddTask={(task) => void run(() => addLinkedTask(db, uid, timer, task))}
      />

      <JiraCard
        uid={uid}
        timer={timer}
        hasJiraLinked={hasJiraLinked}
        busy={busy}
        run={run}
      />


      <label className="pmtt-field">
        <span>Comentários</span>
        <textarea
          rows={2}
          value={comments}
          maxLength={1000}
          placeholder="Notas do registro…"
          onChange={(e) => setComments(e.target.value)}
          onBlur={() => saveComments(comments)}
        />
      </label>
      {commentTemplates.length > 0 ? (
        <div className="pmtt-templates">
          {commentTemplates.map((template) => (
            <button
              key={template}
              type="button"
              className="pmtt-template-chip"
              title={template}
              onClick={() => appendTemplate(template)}
            >
              {template.length > 34 ? `${template.slice(0, 34)}…` : template}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

const TASK_TYPE_LABEL: Record<LinkedTask["type"], string> = {
  jira: "Jira",
  movidesk: "Movidesk",
  link: "Link",
};

function TasksEditor({
  uid: _uid,
  tasks,
  busy,
  onChange,
  onAddTask,
}: {
  uid: string;
  tasks: LinkedTask[];
  busy: boolean;
  onChange: (next: LinkedTask[]) => void;
  onAddTask: (task: LinkedTask) => void;
}) {
  const [type, setType] = useState<LinkedTask["type"]>("movidesk");
  const [reference, setReference] = useState("");
  const [storyPoints, setStoryPoints] = useState<LinkedTask["storyPoints"]>(0);
  const [capturing, setCapturing] = useState(false);

  // Captura a URL da aba ativa; se for um ticket do Movidesk ou issue do Jira,
  // ajusta o tipo automaticamente e usa a URL canônica.
  async function captureActiveUrl() {
    setCapturing(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) return;
      const detected = detectFromUrl(tab.url);
      if (detected) {
        setType(detected.type);
        setReference(detected.reference);
      } else {
        setReference(tab.url);
      }
    } finally {
      setCapturing(false);
    }
  }

  function addTask() {
    const trimmed = reference.trim();
    if (!trimmed) return;
    onAddTask({ type, reference: trimmed, storyPoints });
    setReference("");
    setStoryPoints(0);
  }

  return (
    <div className="pmtt-tasks">
      <div className="pmtt-tasks-header">
        <span className="pmtt-field-label">
          Tasks vinculadas {tasks.length > 0 ? `(${tasks.length})` : ""}
        </span>
      </div>
      {tasks.map((task, index) => (
        <div key={`${task.type}:${task.reference}:${index}`} className="pmtt-task-row">
          <span className={`pmtt-task-type is-${task.type}`}>{TASK_TYPE_LABEL[task.type]}</span>
          <span className="pmtt-task-ref" title={task.reference}>
            {task.reference}
          </span>
          {task.storyPoints > 0 && (
            <span className="pmtt-task-sp">{task.storyPoints} SP</span>
          )}
          <button
            type="button"
            className="pmtt-task-remove"
            title="Remover task"
            disabled={busy}
            onClick={() => onChange(tasks.filter((_, i) => i !== index))}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <div className="pmtt-task-add">
        <select value={type} onChange={(e) => setType(e.target.value as LinkedTask["type"])}>
          <option value="movidesk">Movidesk</option>
          <option value="jira">Jira</option>
          <option value="link">Link</option>
        </select>
        <input
          type="text"
          value={reference}
          placeholder="Link ou referência"
          onChange={(e) => setReference(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
        />
        <select
          value={String(storyPoints)}
          title="Story points"
          onChange={(e) => setStoryPoints(Number(e.target.value) as LinkedTask["storyPoints"])}
        >
          {STORY_POINT_OPTIONS.map((points) => (
            <option key={points} value={String(points)}>{points} SP</option>
          ))}
        </select>
        <button
          type="button"
          className="pmtt-url-btn"
          title="Capturar URL da aba ativa"
          disabled={busy || capturing}
          onClick={() => void captureActiveUrl()}
        >
          <Link2 size={15} />
        </button>
        <button
          type="button"
          className="pmtt-add-btn"
          disabled={busy || !reference.trim()}
          onClick={addTask}
          title="Adicionar task"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}


function JiraCard({
  uid,
  timer,
  hasJiraLinked,
  busy,
  run,
}: {
  uid: string;
  timer: ActiveTimer;
  hasJiraLinked: boolean;
  busy: boolean;
  run: (op: () => Promise<string | void>) => Promise<void>;
}) {
  const [jiraValue, setJiraValue] = useState("");
  const [jiraPoints, setJiraPoints] = useState<StoryPoints>(0);

  function addJira() {
    const raw = jiraValue.trim();
    if (!raw) return;
    const reference = /^[A-Za-z][A-Za-z0-9]*-\d+$/.test(raw)
      ? `https://bitzsoftwares.atlassian.net/browse/${raw.toUpperCase()}`
      : raw;
    void run(async () => {
      await addLinkedTask(db, uid, timer, { type: "jira", reference, storyPoints: jiraPoints });
      return "Task do Jira vinculada — registro marcado como task criada.";
    });
    setJiraValue("");
    setJiraPoints(0);
  }

  return (
    <div className="pmtt-jira-card">
      <div className="pmtt-jira-card-header">
        <span className="pmtt-jira-badge-big">Jira</span>
        <span className="pmtt-jira-card-title">Criou task no Jira?</span>
        {hasJiraLinked
          ? <span className="pmtt-jira-linked">✓ Já marcada neste timer</span>
          : <span className="pmtt-muted" style={{ fontSize: '12px' }}>(marca o registro como task criada)</span>}
      </div>
      <div className="pmtt-jira-row">
        <input
          type="text"
          value={jiraValue}
          placeholder="BITZ-123 ou link completo"
          onChange={(e) => setJiraValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addJira(); }}
        />
        <select
          value={String(jiraPoints)}
          title="Story points"
          onChange={(e) => setJiraPoints(Number(e.target.value) as StoryPoints)}
        >
          {STORY_POINT_OPTIONS.map((p) => (
            <option key={p} value={String(p)}>{p} SP</option>
          ))}
        </select>
        <button
          type="button"
          className="pmtt-add-btn"
          disabled={busy || !jiraValue.trim()}
          title="Vincular task do Jira"
          onClick={addJira}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

