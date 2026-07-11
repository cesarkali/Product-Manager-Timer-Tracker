// Configurações da extensão — vivem no chrome.storage.sync (sincronizam entre
// máquinas com o mesmo perfil do Chrome), separadas dos dados do PMTT no
// Firestore. Nada aqui toca os registros de tempo.

/** Regra de automação por domínio: quando a aba ativa casar com `pattern` e o
 * cronômetro atual não for da categoria indicada, sugere a troca via
 * notificação do Chrome (com botão de um clique). Nunca troca sozinha — a
 * decisão de categoria é sempre do usuário. */
export interface DomainRule {
  id: string;
  /** Trecho de URL, ex.: "bitz.movidesk.com" ou "atlassian.net/browse". */
  pattern: string;
  actionTypeId: string;
  /** Nome denormalizado para exibir na notificação sem consultar o Firestore. */
  actionTypeName: string;
  notify: boolean;
  /** Minutos sem repetir a notificação da mesma regra (padrão 15). */
  cooldownMinutes: number;
}

export interface ExtensionSettings {
  domainRules: DomainRule[];
  /** Textos fixos para inserir com um clique no comentário do timer. */
  commentTemplates: string[];
  /** Se true, as regras também notificam com um cronômetro rodando (sugerindo
   * a troca de categoria). Padrão false: só notifica quando não há timer —
   * quem já está cronometrando não é interrompido. */
  notifyWhileRunning: boolean;
}

/** URL do PMTT publicado — o botão "Abrir PMTT" do popup aponta para cá. */
export const PMTT_APP_URL = "https://pmtt.caliberda.com.br";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  domainRules: [],
  commentTemplates: [
    "Task criada no Jira a partir do ticket do Movidesk.",
    "Atendimento resolvido sem necessidade de task.",
  ],
  notifyWhileRunning: false,
};

export async function loadSettings(): Promise<ExtensionSettings> {
  const raw = await chrome.storage.sync.get("settings");
  return { ...DEFAULT_SETTINGS, ...((raw.settings as Partial<ExtensionSettings>) ?? {}) };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.sync.set({ settings });
}

export function watchSettings(callback: (settings: ExtensionSettings) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.settings) {
      callback({
        ...DEFAULT_SETTINGS,
        ...((changes.settings.newValue as Partial<ExtensionSettings>) ?? {}),
      });
    }
  });
}

/** Casa uma URL com o padrão da regra: comparação de substring, sem esquema e
 * sem diferenciar maiúsculas ("Bitz.Movidesk.com/Ticket" casa com
 * "movidesk.com"). Padrão vazio nunca casa. */
export function urlMatchesPattern(url: string, pattern: string): boolean {
  const normalizedPattern = pattern.trim().toLowerCase().replace(/^https?:\/\//, "");
  if (!normalizedPattern) return false;
  const normalizedUrl = url.toLowerCase().replace(/^https?:\/\//, "");
  return normalizedUrl.includes(normalizedPattern);
}
