// Conexão do content script com o service worker via Port. O service worker
// MV3 dorme quando ocioso e derruba a porta; aqui reconectamos automaticamente
// (imediato se a aba está visível, senão ao voltar a ficar visível) — o próprio
// connect() acorda o service worker.
import {
  WIDGET_PORT_NAME,
  type BackgroundMessage,
  type WidgetCommand,
  type WidgetState,
} from "../lib/messages";

export interface CommandResult {
  ok: boolean;
  error?: string;
}

const ACK_TIMEOUT_MS = 8000;

export class BackgroundLink {
  private port: chrome.runtime.Port | null = null;
  private stateListeners = new Set<(state: WidgetState) => void>();
  private pendingAcks: Array<{
    commandType: WidgetCommand["type"];
    resolve: (result: CommandResult) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = [];

  lastState: WidgetState | null = null;

  constructor() {
    this.connect();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && !this.port) this.connect();
    });
  }

  private connect() {
    try {
      this.port = chrome.runtime.connect({ name: WIDGET_PORT_NAME });
    } catch {
      // Extensão recarregada/removida — contexto invalidado; nada a fazer.
      this.port = null;
      return;
    }

    this.port.onMessage.addListener((message: BackgroundMessage) => {
      if (message.type === "state") {
        this.lastState = message.state;
        for (const listener of this.stateListeners) listener(message.state);
        return;
      }
      if (message.type === "ack") {
        const index = this.pendingAcks.findIndex((p) => p.commandType === message.commandType);
        if (index >= 0) {
          const [pending] = this.pendingAcks.splice(index, 1);
          clearTimeout(pending.timeout);
          pending.resolve({ ok: message.ok, error: message.error });
        }
      }
    });

    this.port.onDisconnect.addListener(() => {
      this.port = null;
      if (document.visibilityState === "visible") {
        setTimeout(() => {
          if (!this.port) this.connect();
        }, 1500);
      }
    });
  }

  onState(listener: (state: WidgetState) => void): () => void {
    this.stateListeners.add(listener);
    if (this.lastState) listener(this.lastState);
    return () => this.stateListeners.delete(listener);
  }

  send(command: WidgetCommand): Promise<CommandResult> {
    if (!this.port) this.connect();
    if (!this.port) {
      return Promise.resolve({
        ok: false,
        error: "Extensão indisponível — recarregue a página.",
      });
    }
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        const index = this.pendingAcks.findIndex((p) => p.resolve === resolve);
        if (index >= 0) this.pendingAcks.splice(index, 1);
        resolve({ ok: false, error: "Sem resposta da extensão — tente de novo." });
      }, ACK_TIMEOUT_MS);
      this.pendingAcks.push({ commandType: command.type, resolve, timeout });
      try {
        this.port!.postMessage(command);
      } catch {
        clearTimeout(timeout);
        this.pendingAcks = this.pendingAcks.filter((p) => p.resolve !== resolve);
        this.port = null;
        resolve({ ok: false, error: "Conexão perdida — tente de novo." });
      }
    });
  }
}
