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

export const STORY_POINT_OPTIONS = [1, 2, 3, 5, 8, 13, 21] as const;
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActiveTimer {
  actionTypeId: string;
  startTime: Timestamp;
  tasks: LinkedTask[];
  comments: string | null;
}
