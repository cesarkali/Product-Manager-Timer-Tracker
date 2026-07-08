export type RangePreset = "today" | "7d" | "30d" | "month" | "lastMonth" | "custom";

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
  if (preset === "month") {
    const start = startOfDay(now);
    start.setDate(1);
    return { start, end };
  }
  if (preset === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: startOfDay(start), end: endOfDay(lastDay) };
  }
  const days = preset === "7d" ? 6 : 29;
  const start = startOfDay(now);
  start.setDate(start.getDate() - days);
  return { start, end };
}

export function customRange(start: Date, end: Date): DateRange {
  return { start: startOfDay(start), end: endOfDay(end) };
}

/** Período imediatamente anterior com a mesma duração — base da comparação
 * "vs período anterior" do dashboard. Ex.: 7 dias → os 7 dias anteriores. */
export function previousRange(range: DateRange): DateRange {
  const spanMs = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - spanMs - 1),
    end: new Date(range.start.getTime() - 1),
  };
}
