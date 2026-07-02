export type RangePreset = "today" | "7d" | "30d" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function rangeForPreset(preset: Exclude<RangePreset, "custom">, now = new Date()): DateRange {
  const end = endOfDay(now);
  if (preset === "today") {
    return { start: startOfDay(now), end };
  }
  const days = preset === "7d" ? 6 : 29;
  const start = startOfDay(now);
  start.setDate(start.getDate() - days);
  return { start, end };
}

export function customRange(start: Date, end: Date): DateRange {
  return { start: startOfDay(start), end: endOfDay(end) };
}
