// CSS do widget injetado no Movidesk/Jira via Shadow DOM.
// Design idêntico ao popup — mesmos tokens, mesmas classes, mesmo visual.
// Tema claro/escuro controlado pela classe .light no elemento .wrap.
export const WIDGET_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:host {
  all: initial;
  /* color-scheme: only light = Dark Reader não injeta dark mode neste shadow root */
  color-scheme: only light;
}

/* Bloqueia filtros do modo Filter do Dark Reader */
:host > * {
  -webkit-filter: none !important;
  filter: none !important;
}

/* Bloqueia filtros do modo Filter do Dark Reader */
:host > * {
  -webkit-filter: none !important;
  filter: none !important;
}

/* ═══════════════════════════════════════════════════════════════
   DARK READER — OVERRIDE COMPLETO COM VALORES HARDCODED
   CSS custom properties podem ser sobrescritas pelo Dark Reader.
   Valores literais com !important NÃO podem — solução definitiva.
   Cobre TODOS os elementos com cor relevante, dark e light.
   ═══════════════════════════════════════════════════════════════ */

/* --- filtros e efeitos: nenhum --- */
.wrap, .wrap * {
  -webkit-filter:    none !important;
  filter:            none !important;
  text-decoration-color: inherit !important;
}

/* --- TEMA ESCURO (padrão) --- */
/* painel */
.wrap .panel         { background-color: #0d1117 !important; color: #e2e8f0 !important; border-color: #1e2533 !important; }
.wrap .panel-header  { background-color: #161b22 !important; color: #e2e8f0 !important; border-bottom-color: #1e2533 !important; }
.wrap .panel-body    { background-color: transparent !important; color: #e2e8f0 !important; }
/* timer */
.wrap .timer-card    { background-color: #161b22 !important; color: #e2e8f0 !important; border-color: #1e2533 !important; }
.wrap .timer-head    { color: #e2e8f0 !important; }
.wrap .timer-name    { color: #e2e8f0 !important; }
.wrap .clock         { color: #e2e8f0 !important; -webkit-text-fill-color: #e2e8f0 !important; background: transparent !important; text-shadow: 0 0 30px #9580f5, 0 0 60px rgba(124,110,224,.3) !important; }
.wrap .clock.paused  { color: #a0aec0 !important; -webkit-text-fill-color: #a0aec0 !important; text-shadow: none !important; }
.wrap .paused-badge  { color: #d69e2e !important; border-color: #d69e2e !important; background: transparent !important; }
/* botões */
.wrap .btn           { background-color: #1c2230 !important; color: #e2e8f0 !important; border-color: #2d3748 !important; }
.wrap .btn.primary   { background-color: #7c6ee0 !important; color: #fff !important; border-color: #7c6ee0 !important; }
.wrap .btn.danger    { color: #e53e3e !important; border-color: #2d3748 !important; background-color: #1c2230 !important; }
.wrap .btn.danger.confirm { background-color: rgba(229,62,62,.13) !important; border-color: #e53e3e !important; }
.wrap .icon-btn      { background: transparent !important; color: #a0aec0 !important; border: none !important; }
.wrap .icon-btn:hover { background-color: #222a38 !important; color: #e2e8f0 !important; }
.wrap .add-btn       { background-color: rgba(124,110,224,.15) !important; color: #7c6ee0 !important; border-color: #7c6ee0 !important; }
.wrap .url-btn       { background-color: #1c2230 !important; color: #a0aec0 !important; border-color: #2d3748 !important; }
.wrap .task-remove   { background: transparent !important; color: #a0aec0 !important; border: none !important; }
/* campos */
.wrap input, .wrap select, .wrap textarea {
  background-color: #1c2230 !important;
  color: #e2e8f0 !important;
  border-color: #2d3748 !important;
}
/* textos e labels */
.wrap .brand         { color: #e2e8f0 !important; }
.wrap .brand-dot     { background-color: #7c6ee0 !important; }
.wrap .field-label   { color: #a0aec0 !important; }
.wrap .muted         { color: #a0aec0 !important; }
.wrap .muted-center  { color: #a0aec0 !important; }
.wrap .section-title { color: #a0aec0 !important; }
.wrap .task-ref      { color: #e2e8f0 !important; }
.wrap .task-sp       { color: #a0aec0 !important; background-color: #222a38 !important; }
/* tasks e cards */
.wrap .task-row      { background-color: #1c2230 !important; color: #e2e8f0 !important; border-color: #1e2533 !important; }
.wrap .task-type.jira     { background-color: rgba(59,130,246,.2) !important; color: #60a5fa !important; }
.wrap .task-type.movidesk { background-color: rgba(16,185,129,.2) !important; color: #34d399 !important; }
.wrap .jira-card     { background: linear-gradient(135deg,rgba(124,110,224,.15),#161b22) !important; border-color: rgba(124,110,224,.35) !important; }
.wrap .jira-badge    { background-color: #7c6ee0 !important; color: #fff !important; }
.wrap .jira-card-title { color: #e2e8f0 !important; }
.wrap .jira-linked   { color: #38a169 !important; background-color: rgba(56,161,105,.15) !important; }
/* ticket detectado */
.wrap .detected-card          { border-color: #2d3748 !important; }
.wrap .detected-card.movidesk { border-color: rgba(16,185,129,.45) !important; background-color: rgba(16,185,129,.07) !important; }
.wrap .detected-card.jira     { border-color: rgba(59,130,246,.45) !important; background-color: rgba(59,130,246,.07) !important; }
.wrap .detected-id   { color: #e2e8f0 !important; }
.wrap .linked-ok     { color: #38a169 !important; background-color: rgba(56,161,105,.15) !important; }
/* categorias */
.wrap .cat-item      { background-color: #161b22 !important; color: #e2e8f0 !important; border-color: #1e2533 !important; }
.wrap .cat-item.current { background-color: rgba(124,110,224,.15) !important; border-color: #7c6ee0 !important; }
.wrap .cat-name      { color: #e2e8f0 !important; }
.wrap .cat-key       { color: #a0aec0 !important; border-color: #2d3748 !important; }
/* templates */
.wrap .tpl           { color: #a0aec0 !important; border-color: #2d3748 !important; background: transparent !important; }
/* pill */
.wrap .pill          { background-color: #161b22 !important; color: #e2e8f0 !important; border-color: #2d3748 !important; }
.wrap .pill-name     { color: #a0aec0 !important; }
.wrap .pill-paused   { color: #d69e2e !important; }
/* toast e collapse */
.wrap .toast         { background-color: #1c2230 !important; border-color: #1e2533 !important; color: #e2e8f0 !important; }
.wrap .toast.error   { border-color: #e53e3e !important; color: #e53e3e !important; }
.wrap .collapse-btn  { background-color: #1c2230 !important; color: #a0aec0 !important; border-color: #1e2533 !important; }
.wrap .no-timer      { background-color: #161b22 !important; color: #a0aec0 !important; border-color: #2d3748 !important; }

/* --- TEMA CLARO (.wrap.light) --- */
.wrap.light .panel         { background-color: #f0f4f8 !important; color: #1a202c !important; border-color: #e2e8f0 !important; }
.wrap.light .panel-header  { background-color: #ffffff !important; color: #1a202c !important; border-bottom-color: #e2e8f0 !important; }
.wrap.light .timer-card    { background-color: #ffffff !important; color: #1a202c !important; border-color: #e2e8f0 !important; }
.wrap.light .timer-name    { color: #1a202c !important; }
.wrap.light .clock         { color: #1a202c !important; -webkit-text-fill-color: #1a202c !important; text-shadow: 0 0 30px #7c63e8, 0 0 60px rgba(107,82,214,.2) !important; }
.wrap.light .clock.paused  { color: #718096 !important; -webkit-text-fill-color: #718096 !important; text-shadow: none !important; }
.wrap.light .paused-badge  { color: #b7791f !important; border-color: #b7791f !important; }
.wrap.light .btn           { background-color: #edf2f7 !important; color: #1a202c !important; border-color: #cbd5e0 !important; }
.wrap.light .btn.primary   { background-color: #6b52d6 !important; color: #fff !important; border-color: #6b52d6 !important; }
.wrap.light .btn.danger    { color: #c53030 !important; background-color: #edf2f7 !important; }
.wrap.light .icon-btn      { color: #718096 !important; background: transparent !important; }
.wrap.light .icon-btn:hover { background-color: #e2e8f0 !important; color: #1a202c !important; }
.wrap.light .add-btn       { background-color: rgba(107,82,214,.12) !important; color: #6b52d6 !important; border-color: #6b52d6 !important; }
.wrap.light .url-btn       { background-color: #edf2f7 !important; color: #718096 !important; border-color: #cbd5e0 !important; }
.wrap.light input, .wrap.light select, .wrap.light textarea {
  background-color: #edf2f7 !important; color: #1a202c !important; border-color: #cbd5e0 !important;
}
.wrap.light .brand         { color: #1a202c !important; }
.wrap.light .field-label   { color: #718096 !important; }
.wrap.light .muted         { color: #718096 !important; }
.wrap.light .section-title { color: #718096 !important; }
.wrap.light .task-row      { background-color: #edf2f7 !important; border-color: #e2e8f0 !important; color: #1a202c !important; }
.wrap.light .task-ref      { color: #1a202c !important; }
.wrap.light .task-sp       { color: #718096 !important; background-color: #e2e8f0 !important; }
.wrap.light .task-remove   { color: #718096 !important; }
.wrap.light .jira-card     { background: linear-gradient(135deg,rgba(107,82,214,.12),#ffffff) !important; border-color: rgba(107,82,214,.35) !important; }
.wrap.light .jira-badge    { background-color: #6b52d6 !important; }
.wrap.light .jira-card-title { color: #1a202c !important; }
.wrap.light .cat-item      { background-color: #ffffff !important; color: #1a202c !important; border-color: #e2e8f0 !important; }
.wrap.light .cat-item.current { background-color: rgba(107,82,214,.12) !important; border-color: #6b52d6 !important; }
.wrap.light .cat-name      { color: #1a202c !important; }
.wrap.light .cat-key       { color: #718096 !important; border-color: #cbd5e0 !important; }
.wrap.light .tpl           { color: #718096 !important; border-color: #cbd5e0 !important; }
.wrap.light .pill          { background-color: #ffffff !important; color: #1a202c !important; border-color: #cbd5e0 !important; }
.wrap.light .pill-name     { color: #718096 !important; }
.wrap.light .no-timer      { background-color: #ffffff !important; color: #718096 !important; border-color: #cbd5e0 !important; }
.wrap.light .collapse-btn  { background-color: #edf2f7 !important; color: #718096 !important; border-color: #e2e8f0 !important; }
.wrap.light .toast         { background-color: #edf2f7 !important; border-color: #e2e8f0 !important; color: #1a202c !important; }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── tokens escuro (padrão) ──────────────────────────────────── */
.wrap {
  --bg:         #0d1117;
  --surface:    #161b22;
  --surface2:   #1c2230;
  --surface3:   #222a38;
  --border:     #2d3748;
  --border-s:   #1e2533;
  --text:       #e2e8f0;
  --text-2:     #a0aec0;
  --accent:     #7c6ee0;
  --accent-hl:  #9580f5;
  --accent-dim: rgba(124,110,224,.15);
  --ok:         #38a169;
  --ok-dim:     rgba(56,161,105,.15);
  --danger:     #e53e3e;
  --danger-dim: rgba(229,62,62,.13);
  --warn:       #d69e2e;
  --r:          14px;
  --r-sm:       8px;
  --r-xs:       6px;
  --shadow:     0 20px 60px rgba(0,0,0,.65);

  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 2147483000;
  font-family: 'Inter','Segoe UI',system-ui,sans-serif;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

/* ── tokens claro ────────────────────────────────────────────── */
.wrap.light {
  --bg:         #f0f4f8;
  --surface:    #ffffff;
  --surface2:   #edf2f7;
  --surface3:   #e2e8f0;
  --border:     #cbd5e0;
  --border-s:   #e2e8f0;
  --text:       #1a202c;
  --text-2:     #718096;
  --accent:     #6b52d6;
  --accent-hl:  #7c63e8;
  --accent-dim: rgba(107,82,214,.12);
  --ok:         #276749;
  --ok-dim:     rgba(39,103,73,.12);
  --danger:     #c53030;
  --danger-dim: rgba(197,48,48,.1);
  --warn:       #b7791f;
}

/* ── scrollbar ───────────────────────────────────────────────── */
.panel::-webkit-scrollbar       { width: 5px; }
.panel::-webkit-scrollbar-track { background: transparent; }
.panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }
.panel::-webkit-scrollbar-thumb:hover { background: var(--text-2); }

/* ================================================
   PÍLULA RECOLHIDA
   ================================================ */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 9px 16px;
  cursor: pointer;
  box-shadow: var(--shadow);
  user-select: none;
  transition: border-color .2s, box-shadow .2s;
}
.pill:hover {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim), var(--shadow);
}

.pill-dot {
  width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0;
  animation: pulse 2.6s ease-in-out infinite;
}
.pill-dot.is-off { background: var(--border); animation: none; }
@keyframes pulse {
  0%,100% { opacity: 1; }
  50%      { opacity: .65; }
}

.pill-time { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13.5px; }
.pill-name { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-2); font-size: 12.5px; }
.pill-paused { color: var(--warn); font-size: 11px; font-weight: 600; }

/* ================================================
   PAINEL EXPANDIDO
   ================================================ */
.panel {
  width: 480px;
  max-height: min(80vh, 680px);
  overflow-y: auto;
  background: var(--bg);
  border: 1px solid var(--border-s);
  border-radius: var(--r);
  box-shadow: var(--shadow);
  display: flex; flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
  animation: panelIn .18s ease;
}
@keyframes panelIn {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── header do painel (sticky) ── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border-s);
  position: sticky; top: 0; z-index: 5;
  flex-shrink: 0;
  border-radius: var(--r) var(--r) 0 0;
}

.brand {
  display: inline-flex; align-items: center; gap: 9px;
  font-weight: 800; font-size: 14.5px; letter-spacing: -.02em;
}

.brand-dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
  animation: glow 2.6s ease-in-out infinite;
}
@keyframes glow {
  0%,100% { box-shadow: 0 0 8px var(--accent); }
  50%      { box-shadow: 0 0 18px var(--accent-hl); }
}

.header-actions { display: flex; gap: 4px; align-items: center; }

.icon-btn {
  width: 30px; height: 30px;
  border: none; background: transparent; color: var(--text-2);
  border-radius: var(--r-sm); cursor: pointer; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s;
  font-family: inherit;
}
.icon-btn:hover { background: var(--surface3); color: var(--text); }

/* ── corpo scrollável ── */
.panel-body {
  padding: 16px;
  display: flex; flex-direction: column; gap: 14px;
  flex: 1;
}

.muted { color: var(--text-2); font-size: 12.5px; }
.muted-center { color: var(--text-2); font-size: 13px; text-align: center; padding: 20px 0; }

/* ── timer ativo ── */
.timer-card {
  background: var(--surface);
  border: 1px solid var(--border-s);
  border-radius: var(--r);
  padding: 16px;
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 2px 16px rgba(0,0,0,.12);
}

.timer-head { display: flex; align-items: center; gap: 10px; }

.chip {
  width: 12px; height: 12px; border-radius: 4px; flex-shrink: 0;
  filter: drop-shadow(0 0 4px currentColor);
}

.timer-name {
  font-weight: 700; font-size: 14.5px; flex: 1;
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.paused-badge {
  font-size: 11px; font-weight: 600; color: var(--warn);
  border: 1px solid var(--warn); border-radius: 999px; padding: 1px 9px;
}

.clock {
  font-size: 52px; font-weight: 800; text-align: center;
  letter-spacing: .02em; font-variant-numeric: tabular-nums;
  /* Cor sólida com text-shadow: não depende de background-clip
     que é quebrado pelo Dark Reader (ele sobreescreve o background) */
  color: var(--text) !important;
  -webkit-text-fill-color: var(--text) !important;
  background: transparent !important;
  text-shadow:
    0 0 30px var(--accent-hl),
    0 0 60px rgba(124,110,224,.3);
  line-height: 1.1; padding: 6px 0;
  transition: color .3s;
}
.clock.paused {
  color: var(--text-2) !important;
  -webkit-text-fill-color: var(--text-2) !important;
  text-shadow: none;
}

/* ── controles ── */
.controls { display: flex; gap: 8px; }

.btn {
  flex: 1; padding: 9px 14px;
  border: 1px solid var(--border); background: var(--surface2); color: var(--text);
  border-radius: var(--r-sm); font-size: 12.5px; font-weight: 600;
  font-family: inherit; cursor: pointer;
  transition: border-color .15s, background .15s, transform .1s;
}
.btn:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-dim); }
.btn:active:not(:disabled) { transform: scale(.97); }
.btn:disabled { opacity: .4; cursor: default; }

.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn.primary:hover:not(:disabled) { background: var(--accent-hl); border-color: var(--accent-hl); }

.btn.danger { color: var(--danger); }
.btn.danger:hover:not(:disabled) { border-color: var(--danger); background: var(--danger-dim); }
.btn.danger.confirm { background: var(--danger-dim); border-color: var(--danger); }

.no-timer {
  padding: 28px 16px; border: 1.5px dashed var(--border);
  border-radius: var(--r); color: var(--text-2); text-align: center;
  background: var(--surface);
}

/* ── campos ── */
.field { display: flex; flex-direction: column; gap: 5px; }

.field-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: var(--text-2);
}

input, select, textarea {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--r-sm); color: var(--text);
  padding: 8px 11px; font-size: 13px; font-family: inherit; width: 100%;
  transition: border-color .15s, box-shadow .15s;
  appearance: none; -webkit-appearance: none;
}
input:focus, select:focus, textarea:focus {
  outline: none; border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
textarea { resize: vertical; min-height: 56px; }

/* ── ticket detectado ── */
.detected-card {
  border-radius: var(--r); padding: 13px 15px;
  display: flex; flex-direction: column; gap: 10px;
  border: 1px solid var(--border);
}
.detected-card.movidesk { border-color: rgba(16,185,129,.45); background: rgba(16,185,129,.07); }
.detected-card.jira     { border-color: rgba(59,130,246,.45); background: rgba(59,130,246,.07); }

.detected-header { display: flex; align-items: center; gap: 10px; }

.type-badge {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
  border-radius: var(--r-xs); padding: 3px 9px; flex-shrink: 0;
}
.type-badge.movidesk { background: rgba(16,185,129,.25); color: #34d399; }
.type-badge.jira     { background: rgba(59,130,246,.25); color: #60a5fa; }

.detected-id { font-size: 15px; font-weight: 800; flex: 1; }

.linked-ok {
  font-size: 12px; color: var(--ok); font-weight: 600;
  background: var(--ok-dim); padding: 3px 10px; border-radius: 999px;
  display: inline-flex; align-items: center; gap: 5px;
}

.sp-row { display: grid; grid-template-columns: 1fr 60px; gap: 7px; }

/* ── tasks vinculadas ── */
.tasks { display: flex; flex-direction: column; gap: 8px; }

.task-row {
  display: flex; align-items: center; gap: 8px;
  background: var(--surface2); border: 1px solid var(--border-s);
  border-radius: var(--r-sm); padding: 8px 11px;
  transition: border-color .15s;
}
.task-row:hover { border-color: var(--border); }

.task-type {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
  border-radius: var(--r-xs); padding: 2px 7px; flex-shrink: 0;
}
.task-type.jira     { background: rgba(59,130,246,.2); color: #60a5fa; }
.task-type.movidesk { background: rgba(16,185,129,.2); color: #34d399; }

.task-ref { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }

.task-sp {
  font-size: 11px; color: var(--text-2); flex-shrink: 0;
  background: var(--surface3); padding: 1px 6px; border-radius: var(--r-xs);
}

.task-remove {
  width: 24px; height: 24px; border-radius: var(--r-xs);
  border: none; background: transparent; color: var(--text-2);
  cursor: pointer; font-size: 15px; display: flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s; font-family: inherit;
}
.task-remove:hover { background: var(--danger-dim); color: var(--danger); }

/* grid add: tipo | input | SP | 🔗 | + */
.task-add {
  display: grid; grid-template-columns: 96px 1fr 62px 34px 34px; gap: 6px; align-items: start;
}

.url-btn {
  width: 34px; height: 34px; border: 1px solid var(--border); background: var(--surface2); color: var(--text-2);
  border-radius: var(--r-sm); cursor: pointer; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
  transition: border-color .15s, color .15s; font-family: inherit;
}
.url-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.url-btn:disabled { opacity: .4; cursor: default; }

.add-btn {
  width: 34px; height: 34px; border: 1px solid var(--accent); background: var(--accent-dim); color: var(--accent);
  border-radius: var(--r-sm); cursor: pointer; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s; font-family: inherit;
}
.add-btn:hover:not(:disabled) { background: var(--accent); color: #fff; }
.add-btn:disabled { opacity: .4; cursor: default; }

/* ── card Jira ── */
.jira-card {
  background: linear-gradient(135deg, var(--accent-dim), var(--surface));
  border: 1px solid rgba(124,110,224,.35);
  border-radius: var(--r); padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
}

.jira-card-header { display: flex; align-items: center; gap: 10px; }

.jira-badge {
  font-size: 11px; font-weight: 700; background: var(--accent); color: #fff;
  border-radius: var(--r-xs); padding: 3px 9px; text-transform: uppercase; letter-spacing: .05em;
  flex-shrink: 0;
}

.jira-card-title { font-size: 13px; font-weight: 600; flex: 1; }

.jira-linked {
  font-size: 12px; font-weight: 600; color: var(--ok); background: var(--ok-dim);
  padding: 3px 10px; border-radius: 999px;
  display: inline-flex; align-items: center; gap: 5px;
}

.jira-row { display: grid; grid-template-columns: 1fr 62px 34px; gap: 6px; align-items: start; }

/* ── templates ── */
.templates { display: flex; flex-wrap: wrap; gap: 6px; }
.tpl {
  border: 1px solid var(--border); background: transparent; color: var(--text-2);
  border-radius: 999px; padding: 4px 12px; font-size: 12px;
  cursor: pointer; font-family: inherit;
  transition: border-color .15s, color .15s, background .15s;
}
.tpl:hover { border-color: var(--accent); color: var(--text); background: var(--accent-dim); }

/* ── grade de categorias ── */
.section { display: flex; flex-direction: column; gap: 10px; }

.section-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .08em; color: var(--text-2);
}

.cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }

.cat-item {
  display: flex; align-items: center; gap: 9px;
  background: var(--surface); border: 1px solid var(--border-s);
  border-radius: var(--r-sm); padding: 10px 12px;
  color: var(--text); cursor: pointer; text-align: left; min-width: 0;
  font-family: inherit;
  transition: border-color .15s, background .15s, box-shadow .15s, transform .1s;
}
.cat-item:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-dim); box-shadow: 0 0 0 2px var(--accent-dim); }
.cat-item:active:not(:disabled) { transform: scale(.97); }
.cat-item.current { border-color: var(--accent); background: var(--accent-dim); box-shadow: 0 0 0 2px var(--accent-dim); }
.cat-item:disabled { cursor: default; opacity: .95; }

.cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; filter: drop-shadow(0 0 3px currentColor); }
.cat-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; font-weight: 500; }
.cat-key { font-size: 10px; color: var(--text-2); border: 1px solid var(--border); border-radius: 5px; padding: 1px 5px; flex-shrink: 0; font-weight: 600; }

/* ── toast ── */
.toast {
  border-radius: var(--r-sm); border: 1px solid var(--ok); background: var(--surface2);
  padding: 9px 14px; font-size: 12.5px; font-weight: 500; text-align: center;
  animation: slideUp .2s ease;
}
.toast.error { border-color: var(--danger); color: var(--danger); }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── botão recolher ── */
.collapse-btn {
  border: 1px solid var(--border-s); background: var(--surface2); color: var(--text-2);
  border-radius: 0 0 var(--r) var(--r); padding: 8px 16px; font-size: 12px; font-weight: 500;
  font-family: inherit; cursor: pointer; text-align: center; width: 100%;
  transition: border-color .15s, color .15s, background .15s; flex-shrink: 0;
}
.collapse-btn:hover { color: var(--text); background: var(--surface3); }
`;
