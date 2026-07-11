import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  email: string;
  name: string;
  role: "pm";
  createdAt: Timestamp;
  hasSeededActionTypes?: boolean;
  hasSeededBusinessAreas?: boolean;
  sidebarCollapsed?: boolean;
  /** Lembrete "cadê o cronômetro?": desabilitado por padrão. */
  reminderEnabled?: boolean;
  /** Minutos de ociosidade antes de avisar (padrão 15). */
  reminderMinutes?: number;
  /** Início do expediente, "HH:mm" (padrão "08:00"). */
  workStart?: string;
  /** Fim do expediente, "HH:mm" (padrão "18:00"). */
  workEnd?: string;
  /** Dias úteis, 0=domingo..6=sábado (padrão seg–sex). */
  workDays?: number[];
  /** Aceite dos Termos de Uso e Política de Privacidade (checkbox do wizard). */
  termsAcceptedAt?: Timestamp;
  /** Conclusão do wizard de boas-vindas — ausente = primeira visita. */
  onboardingCompletedAt?: Timestamp;
  /** Última versão do changelog vista — controla o badge "Novidades". */
  lastSeenChangelogVersion?: string;
  /** Tema de aparência (skin) salvo no banco — sincronizado entre dispositivos. */
  skin?: string;
  /** Densidade do layout ("confortavel" | "compacto"). */
  density?: string;
  /** Raio dos cantos ("reto" | "padrao" | "redondo"). */
  corners?: string;
}



/** Área de negócio — agrupa categorias no dashboard ("Tempo por área"). CRUD
 * completo pelo usuário em Configurações → Áreas, mesmo padrão de ActionType
 * (cor da paleta fixa, arquivar/reativar, excluir). As 8 áreas originais (antes
 * uma lista fixa em código) são semeadas automaticamente no primeiro acesso ao
 * painel, igual às categorias padrão. */
export interface BusinessArea {
  id: string;
  name: string;
  /** Índice string na mesma paleta de 8 cores das categorias. Opcional para
   * compatibilidade com docs criados antes deste campo existir. */
  colorTag?: string;
  /** Área arquivada some do seletor de área das categorias, mas categorias
   * que já a usam continuam mostrando nome e cor normalmente. Ausente = ativa. */
  archived?: boolean;
  order: number;
  createdAt: Timestamp;
}

export interface ActionType {
  id: string;
  name: string;
  colorTag: string;
  icon: string;
  archived: boolean;
  order: number;
  /** Tecla numérica (1-9) para iniciar essa categoria direto no cronômetro. */
  shortcutKey?: number | null;
  /** Área de negócio atendida (nome de uma BusinessArea) — agrupa categorias no
   * dashboard. Ausente/null = "Sem área". */
  area?: string | null;
  createdAt: Timestamp;
}

export type TimeEntrySource = "timer" | "manual";

/** Limite da descrição curta ("o que você está fazendo?") — distinta dos
 * comentários longos (`notes`, até 1000). */
export const DESCRIPTION_MAX_LENGTH = 140;

export const STORY_POINT_OPTIONS = [0, 1, 2, 3, 5, 8, 13, 21] as const;
export type StoryPoints = (typeof STORY_POINT_OPTIONS)[number];

/** Tipos de vínculo de task. "jira" e "movidesk" existem desde o início e têm
 * detecção/atalhos próprios; "link" é o genérico para qualquer outra
 * ferramenta (Trello, GitHub, planilha, doc…) — aditivo, registros antigos
 * continuam válidos. */
export const TASK_TYPE_LABELS = {
  jira: "Jira",
  movidesk: "Movidesk",
  link: "Link",
} as const;

export type LinkedTaskType = keyof typeof TASK_TYPE_LABELS;

export interface LinkedTask {
  type: LinkedTaskType;
  reference: string;
  storyPoints: StoryPoints;
}

export interface TimeEntry {
  id: string;
  actionTypeId: string;
  actionTypeName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  durationSeconds: number;
  taskCreated: boolean;
  tasks: LinkedTask[];
  notes: string | null;
  /** Descrição curta do que estava sendo feito (≤ DESCRIPTION_MAX_LENGTH).
   * Ausente em registros anteriores à funcionalidade. */
  description?: string | null;
  source: TimeEntrySource;
  /** Segundos pausados descontados entre `startTime` e `endTime`. Gravado
   * automaticamente ao fechar um registro vindo do cronômetro pausado;
   * editável (ou zerável) manualmente no modal de edição. Ausente/0 em
   * registros manuais e em registros antigos sem pausa. */
  pausedSeconds?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActiveTimer {
  actionTypeId: string;
  startTime: Timestamp;
  tasks: LinkedTask[];
  comments: string | null;
  /** Descrição curta do que está sendo feito — herdada pelo registro ao parar.
   * Ausente em docs criados antes da funcionalidade. */
  description?: string | null;
  /** Momento em que o cronômetro foi pausado; `null`/ausente = rodando.
   * Ausente em docs criados antes da funcionalidade de pausa. */
  pausedAt?: Timestamp | null;
  /** Soma de todos os intervalos pausados até agora, em segundos — subtraída
   * do tempo decorrido bruto. Ausente em docs antigos (equivale a 0). */
  accumulatedPausedSeconds?: number;
}
