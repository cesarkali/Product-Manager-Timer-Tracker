// Bootstrap do content script: monta o widget num Shadow DOM (CSS isolado da
// página) e respeita a opção "widget habilitado" das configurações — inclusive
// ao vivo, se for alterada com a página aberta.
import { createRoot, type Root } from "react-dom/client";
import { BackgroundLink } from "./link";
import { Widget } from "./widget";
import { WIDGET_CSS } from "./widget-css";
import { loadSettings, watchSettings } from "../lib/settings";

let host: HTMLDivElement | null = null;
let root: Root | null = null;
let link: BackgroundLink | null = null;

function mount() {
  if (host) return;
  host = document.createElement("div");
  host.id = "pmtt-widget-host";
  // Dark Reader respeita este atributo e não injeta estilos no elemento
  host.setAttribute("data-darkreader-ignore", "");
  // Também sinaliza ao Dark Reader que este elemento gerencia seu próprio tema
  host.setAttribute("data-darkreader-mode", "sync");
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = WIDGET_CSS;
  shadow.appendChild(style);

  const container = document.createElement("div");
  shadow.appendChild(container);
  document.documentElement.appendChild(host);

  link = link ?? new BackgroundLink();
  root = createRoot(container);
  root.render(<Widget link={link} />);
}


function unmount() {
  root?.unmount();
  root = null;
  host?.remove();
  host = null;
}

async function main() {
  // Só no frame principal — o Movidesk usa iframes internos.
  if (window.top !== window) return;

  const settings = await loadSettings();
  if (settings.widgetEnabled) mount();

  watchSettings((next) => {
    if (next.widgetEnabled) mount();
    else unmount();
  });
}

void main();
