import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  email: string;
  name: string;
  role: "pm";
  createdAt: Timestamp;
  hasSeededActionTypes?: boolean;
  sidebarCollapsed?: boolean;
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
  createdAt: Timestamp;
}

export type TimeEntrySource = "timer" | "manual";

export const STORY_POINT_OPTIONS = [0, 1, 2, 3, 5, 8, 13, 21] as const;
export type StoryPoints = (typeof STORY_POINT_OPTIONS)[number];

export interface LinkedTask {
  type: "jira" | "movidesk";
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
  /** Momento em que o cronômetro foi pausado; `null`/ausente = rodando.
   * Ausente em docs criados antes da funcionalidade de pausa. */
  pausedAt?: Timestamp | null;
  /** Soma de todos os intervalos pausados até agora, em segundos — subtraída
   * do tempo decorrido bruto. Ausente em docs antigos (equivale a 0). */
  accumulatedPausedSeconds?: number;
}
