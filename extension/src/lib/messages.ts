// Protocolo entre o content script (widget no Movidesk/Jira) e o service
// worker. O content script NÃO fala com o Firebase diretamente — os Timestamps
// do Firestore são serializados em milissegundos para atravessar a fronteira
// de mensagens do Chrome.
import type { ActiveTimer, ActionType, LinkedTask } from "@/lib/types";

export const WIDGET_PORT_NAME = "pmtt-widget";

export interface SerializedActionType {
  id: string;
  name: string;
  colorTag: string;
  icon: string;
  shortcutKey?: number | null;
}

export interface SerializedTimer {
  actionTypeId: string;
  /** null enquanto o serverTimestamp() não confirmou no servidor. */
  startTimeMs: number | null;
  pausedAtMs: number | null;
  accumulatedPausedSeconds: number;
  tasks: LinkedTask[];
  description: string | null;
  comments: string | null;
}

export interface WidgetState {
  /** false enquanto o service worker ainda carrega auth/snapshot. */
  ready: boolean;
  signedIn: boolean;
  timer: SerializedTimer | null;
  actionTypes: SerializedActionType[];
}

export type WidgetCommand =
  | { type: "start"; actionTypeId: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "stop" }
  | { type: "linkTask"; task: LinkedTask }
  | { type: "setDescription"; value: string }
  | { type: "setComments"; value: string };

export type BackgroundMessage =
  | { type: "state"; state: WidgetState }
  | { type: "ack"; commandType: WidgetCommand["type"]; ok: boolean; error?: string };

export function serializeTimer(timer: ActiveTimer): SerializedTimer {
  return {
    actionTypeId: timer.actionTypeId,
    startTimeMs: timer.startTime ? timer.startTime.toMillis() : null,
    pausedAtMs: timer.pausedAt ? timer.pausedAt.toMillis() : null,
    accumulatedPausedSeconds: timer.accumulatedPausedSeconds ?? 0,
    tasks: timer.tasks ?? [],
    description: timer.description ?? null,
    comments: timer.comments ?? null,
  };
}

export function serializeActionType(actionType: ActionType): SerializedActionType {
  return {
    id: actionType.id,
    name: actionType.name,
    colorTag: actionType.colorTag,
    icon: actionType.icon,
    shortcutKey: actionType.shortcutKey ?? null,
  };
}

/** Mesma conta de computeElapsedMs, mas sobre o timer serializado. */
export function elapsedSecondsFromSerialized(timer: SerializedTimer, nowMs: number): number {
  if (!timer.startTimeMs) return 0;
  const referenceMs = timer.pausedAtMs ?? nowMs;
  return Math.max(
    0,
    Math.floor((referenceMs - timer.startTimeMs - timer.accumulatedPausedSeconds * 1000) / 1000)
  );
}
