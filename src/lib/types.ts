import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  email: string;
  name: string;
  role: "pm";
  createdAt: Timestamp;
}

export interface ActionType {
  id: string;
  name: string;
  colorTag: string;
  icon: string;
  archived: boolean;
  createdAt: Timestamp;
}

export type TimeEntrySource = "timer" | "manual";

export interface TimeEntry {
  id: string;
  actionTypeId: string;
  actionTypeName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  durationSeconds: number;
  taskCreated: boolean;
  movideskLink: string | null;
  jiraLink: string | null;
  notes: string | null;
  source: TimeEntrySource;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActiveTimer {
  actionTypeId: string;
  startTime: Timestamp;
  movideskLink: string | null;
  jiraLink: string | null;
  comments: string | null;
}
