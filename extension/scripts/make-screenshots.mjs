// Gera as screenshots da Chrome Web Store (1280x800) sem dependências novas:
// monta páginas HTML promocionais em um diretório temporário e captura cada
// uma com o Chrome/Edge headless instalado na máquina.
//
// Uso: node extension/scripts/make-screenshots.mjs
// Saída: extension/store/screenshot-*.png
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const extDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(extDir, "store");

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);
  const found = candidates.find((c) => existsSync(c));
  if (!found) {
    console.error("Chrome/Edge não encontrado. Defina CHROME_PATH com o caminho do executável.");
    process.exit(1);
  }
  return found;
}

// ---------------------------------------------------------------------------
// Blocos visuais reutilizados nas cenas
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { name: "Desenvolvimento", color: "#8b7cf0", key: 1, current: true },
  { name: "Reunião", color: "#60a5fa", key: 2 },
  { name: "Suporte", color: "#34d399", key: 3 },
  { name: "Documentação", color: "#e6b04c", key: 4 },
  { name: "Code review", color: "#f472b6", key: 5 },
  { name: "Análise", color: "#22d3ee", key: 6 },
];

function categoryGrid() {
  return `<div class="grid">${CATEGORIES.map(
    (c) => `
    <div class="grid-item${c.current ? " is-current" : ""}">
      <span class="chip" style="background:${c.color}"></span>
      <span class="grid-name">${c.name}</span>
      <span class="grid-key">${c.key}</span>
    </div>`
  ).join("")}</div>`;
}

function taskRows() {
  return `
    <div class="task-row">
      <span class="task-type is-movidesk">Ticket</span>
      <span class="task-ref">Ticket #48213 — cliente sem acesso ao painel</span>
      <span class="task-sp">3 SP</span>
    </div>
    <div class="task-row">
      <span class="task-type is-jira">Task</span>
      <span class="task-ref">PROJ-1042 — Ajuste na importação de notas</span>
      <span class="task-sp">5 SP</span>
    </div>`;
}

function popupMock() {
  return `
  <div class="popup">
    <div class="p-header">
      <span class="brand"><span class="dot"></span> PMTT Timer</span>
      <span class="hicons"><span>◐</span><span>↗</span><span>⚙</span></span>
    </div>
    <div class="p-body">
      <div class="timer-card">
        <div class="timer-head">
          <span class="chip" style="background:#8b7cf0"></span>
          <span class="timer-name">Desenvolvimento</span>
        </div>
        <div class="clock">01:23:45</div>
        <div class="controls">
          <div class="btn">❚❚ Pausar</div>
          <div class="btn btn-primary">■ Parar</div>
          <div class="btn btn-danger">Descartar</div>
        </div>
        <div class="field">
          <span>O que você está fazendo?</span>
          <div class="input">Correção do fluxo de importação</div>
        </div>
        <div class="field"><span>Tasks vinculadas (2)</span>${taskRows()}</div>
      </div>
      <div class="section-title">Trocar de categoria</div>
      ${categoryGrid()}
    </div>
  </div>`;
}

function gridFocusMock() {
  return `
  <div class="popup" style="width:520px">
    <div class="p-body" style="padding:22px">
      <div class="section-title">Trocar de categoria</div>
      ${categoryGrid()}
      <div class="keys-hint">
        ${CATEGORIES.map((c) => `<span class="keycap">${c.key}</span>`).join("")}
        <span class="keys-label">atalhos de teclado, como no app</span>
      </div>
      <div class="switch-toast">✓ Parou "Reunião" (00:42:10) · Iniciou "Desenvolvimento"</div>
    </div>
  </div>`;
}

function notificationMock() {
  return `
  <div class="notif">
    <div class="notif-head">
      <img src="icon.png" alt="" />
      <div>
        <div class="notif-title">PMTT Timer</div>
        <div class="notif-src">Google Chrome</div>
      </div>
    </div>
    <p class="notif-msg">Você está em <strong>suporte.suaempresa.com</strong> sem cronômetro
    rodando. Iniciar "Suporte"?</p>
    <div class="notif-actions">
      <span class="notif-btn primary">Iniciar "Suporte"</span>
      <span class="notif-btn">Ignorar</span>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Template da cena (1280x800): texto à esquerda, visual à direita
// ---------------------------------------------------------------------------

function scene({ eyebrow, headline, bullets, visual, visualScale = 1 }) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1280px; height: 800px; overflow: hidden; }
  body {
    font-family: 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif;
    color: #e6eaf2;
    background:
      radial-gradient(90% 120% at 85% -10%, rgba(139,124,240,.28), transparent 55%),
      radial-gradient(70% 90% at -10% 110%, rgba(70,48,168,.35), transparent 60%),
      #0b0e14;
    display: flex; align-items: center; gap: 56px; padding: 0 72px;
  }
  .copy { flex: 1; min-width: 0; }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 15px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: #a394ff; margin-bottom: 20px;
  }
  .eyebrow::before { content: ""; width: 26px; height: 3px; border-radius: 2px; background: #a394ff; }
  h1 { font-size: 52px; line-height: 1.12; letter-spacing: -.02em; font-weight: 700; margin-bottom: 26px; }
  h1 em { font-style: normal; color: #a394ff; }
  ul { list-style: none; display: flex; flex-direction: column; gap: 14px; }
  li { display: flex; gap: 12px; font-size: 20px; color: #b7c0d4; line-height: 1.45; }
  li::before { content: "✓"; color: #34c98a; font-weight: 700; flex-shrink: 0; }
  .stage { flex-shrink: 0; display: flex; align-items: center; justify-content: center; transform: scale(${visualScale}); }

  /* ── mock do popup ── */
  .popup {
    width: 480px; background: #12161f; border: 1px solid #1d2330;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 40px 90px rgba(0,0,0,.6), 0 0 0 1px rgba(139,124,240,.12);
    font-size: 13px;
  }
  .p-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 18px; border-bottom: 1px solid #1d2330;
    background: linear-gradient(180deg, #12161f, #141724);
  }
  .brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; background: linear-gradient(135deg, #a394ff, #5b4bc4); box-shadow: 0 0 10px #8b7cf0; }
  .hicons { display: flex; gap: 12px; color: #94a0b8; font-size: 15px; }
  .p-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 13px; }
  .timer-card {
    background: radial-gradient(120% 90% at 50% -20%, rgba(139,124,240,.14), transparent 60%), #161a26;
    border: 1px solid #1d2330; border-radius: 16px; padding: 16px;
    display: flex; flex-direction: column; gap: 13px;
  }
  .timer-head { display: flex; align-items: center; gap: 10px; }
  .chip { width: 12px; height: 12px; border-radius: 4px; flex-shrink: 0; }
  .timer-name { font-weight: 700; font-size: 14.5px; }
  .clock {
    font-size: 50px; font-weight: 700; text-align: center;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 28px #a394ff, 0 0 64px rgba(139,124,240,.3);
  }
  .controls { display: flex; gap: 8px; }
  .btn {
    flex: 1; text-align: center; padding: 9px 0; border-radius: 10px;
    border: 1px solid #2c3444; background: #1a1f2b; font-weight: 600; font-size: 12.5px;
  }
  .btn-primary { background: linear-gradient(180deg, #8b7cf0, #5b4bc4); border-color: transparent; color: #fff; }
  .btn-danger { color: #f06a6a; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field > span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #94a0b8; }
  .input { background: #1a1f2b; border: 1px solid #2c3444; border-radius: 10px; padding: 8px 11px; color: #e6eaf2; }
  .task-row {
    display: flex; align-items: center; gap: 8px; background: #1a1f2b;
    border: 1px solid #1d2330; border-radius: 10px; padding: 8px 11px;
  }
  .task-type { font-size: 10px; font-weight: 700; text-transform: uppercase; border-radius: 7px; padding: 2px 7px; }
  .task-type.is-jira { background: rgba(59,130,246,.18); color: #60a5fa; }
  .task-type.is-movidesk { background: rgba(16,185,129,.18); color: #34d399; }
  .task-ref { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }
  .task-sp { font-size: 11px; color: #94a0b8; background: #232937; padding: 1px 6px; border-radius: 7px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a0b8; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .grid-item {
    display: flex; align-items: center; gap: 9px; background: #161a26;
    border: 1px solid #1d2330; border-radius: 10px; padding: 10px 12px;
  }
  .grid-item.is-current { border-color: #8b7cf0; background: rgba(139,124,240,.14); box-shadow: 0 0 0 2px rgba(139,124,240,.14); }
  .grid-name { flex: 1; font-size: 12.5px; font-weight: 500; }
  .grid-key { font-size: 10px; color: #94a0b8; border: 1px solid #2c3444; border-radius: 5px; padding: 1px 5px; font-weight: 600; }
  .keys-hint { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
  .keycap {
    width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
    background: #1a1f2b; border: 1px solid #2c3444; border-bottom-width: 2px;
    border-radius: 6px; font-size: 12px; font-weight: 700; color: #b7c0d4;
  }
  .keys-label { font-size: 12.5px; color: #94a0b8; margin-left: 6px; }
  .switch-toast {
    margin-top: 6px; padding: 10px 14px; border-radius: 10px; text-align: center;
    border: 1px solid #34c98a; color: #34c98a; background: rgba(52,201,138,.08);
    font-size: 12.5px; font-weight: 600;
  }

  /* ── mock de notificação ── */
  .notif {
    width: 420px; background: #1c1f27; border: 1px solid #2c3444; border-radius: 14px;
    padding: 18px 20px; box-shadow: 0 40px 90px rgba(0,0,0,.6);
    display: flex; flex-direction: column; gap: 12px;
  }
  .notif-head { display: flex; align-items: center; gap: 12px; }
  .notif-head img { width: 38px; height: 38px; border-radius: 9px; }
  .notif-title { font-weight: 700; font-size: 15px; }
  .notif-src { font-size: 12px; color: #94a0b8; }
  .notif-msg { font-size: 14px; color: #b7c0d4; line-height: 1.5; }
  .notif-actions { display: flex; gap: 10px; }
  .notif-btn { padding: 8px 18px; border-radius: 9px; font-size: 13px; font-weight: 600; border: 1px solid #2c3444; color: #b7c0d4; }
  .notif-btn.primary { background: linear-gradient(180deg, #8b7cf0, #5b4bc4); border-color: transparent; color: #fff; }
</style></head>
<body>
  <div class="copy">
    <div class="eyebrow">${eyebrow}</div>
    <h1>${headline}</h1>
    <ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
  </div>
  <div class="stage">${visual}</div>
</body></html>`;
}

const SCENES = [
  {
    file: "screenshot-1-timer.png",
    html: scene({
      eyebrow: "PMTT Timer",
      headline: "Seu tempo de trabalho, <em>registrado sem esforço</em>",
      bullets: [
        "Cronômetro sempre à mão, direto do ícone do navegador",
        "Badge com o tempo decorrido, mesmo com o popup fechado",
        "Tudo sincronizado com o seu PMTT em tempo real",
      ],
      visual: popupMock(),
      visualScale: 0.92,
    }),
  },
  {
    file: "screenshot-2-categorias.png",
    html: scene({
      eyebrow: "Categorias e atalhos",
      headline: "Troque de categoria com <em>um clique ou uma tecla</em>",
      bullets: [
        "Atalhos 1–9, iguais aos do app web do PMTT",
        "O timer anterior é encerrado e registrado automaticamente",
        "Cores e ícones das suas categorias, como você configurou",
      ],
      visual: gridFocusMock(),
      visualScale: 1.05,
    }),
  },
  {
    file: "screenshot-3-regras.png",
    html: scene({
      eyebrow: "Regras por domínio",
      headline: "O PMTT percebe onde você está e <em>sugere a categoria certa</em>",
      bullets: [
        "Abriu a ferramenta de suporte? Receba a sugestão da categoria certa",
        "A troca nunca é automática — a decisão é sempre sua",
        "Vincule tickets, tasks e links de qualquer ferramenta ao registro",
      ],
      visual: notificationMock(),
      visualScale: 1.1,
    }),
  },
];

// ---------------------------------------------------------------------------

const browser = findBrowser();
mkdirSync(outDir, { recursive: true });
const workDir = mkdtempSync(path.join(tmpdir(), "pmtt-shots-"));

try {
  // Ícone usado no mock da notificação.
  const icon = path.join(extDir, "dist", "icons", "icon128.png");
  if (existsSync(icon)) {
    writeFileSync(path.join(workDir, "icon.png"), await import("node:fs").then((fs) => fs.readFileSync(icon)));
  }

  for (const { file, html } of SCENES) {
    const htmlPath = path.join(workDir, file.replace(/\.png$/, ".html"));
    writeFileSync(htmlPath, html);
    const outPath = path.join(outDir, file);
    execFileSync(browser, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1280,800",
      `--screenshot=${outPath}`,
      pathToFileURL(htmlPath).href,
    ], { stdio: "pipe" });
    console.log(`✓ ${path.relative(process.cwd(), outPath)}`);
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
