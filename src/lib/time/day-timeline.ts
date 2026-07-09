import type { TimeEntry } from "@/lib/types";

export interface TimelineBlock {
  kind: "entry" | "active" | "gap";
  startMs: number;
  endMs: number;
  /** Presente quando kind === "entry". */
  entry?: TimeEntry;
}

export interface DayTimelineResult {
  blocks: TimelineBlock[];
  /** Início do eixo visível (hora cheia). */
  axisStartMs: number;
  /** Fim do eixo visível (hora cheia). */
  axisEndMs: number;
  /** Marca (ms) de cada hora cheia dentro do eixo. */
  hourTicks: number[];
}

/** Lacunas menores que isso não viram bloco clicável (5 min). */
export const MIN_GAP_MS = 5 * 60_000;

const HOUR_MS = 60 * 60_000;

function parseHourMinute(value: string, base: Date): number {
  const [h, m] = value.split(":").map(Number);
  const d = new Date(base);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d.getTime();
}

function floorToHour(ms: number): number {
  return Math.floor(ms / HOUR_MS) * HOUR_MS;
}

function ceilToHour(ms: number): number {
  return Math.ceil(ms / HOUR_MS) * HOUR_MS;
}

/** Monta a timeline do dia: blocos de registro (individuais), o cronômetro em
 * andamento e as lacunas sem registro dentro do expediente — cada lacuna vira
 * um alvo clicável para lançamento retroativo. `entries` deve conter apenas os
 * registros de hoje; registros que começaram ontem e viraram a noite ficam de
 * fora (a query filtra por startTime), limitação aceitável para o caso de uso. */
export function buildDayTimeline({
  entries,
  activeTimer,
  workStart,
  workEnd,
  now,
  minGapMs = MIN_GAP_MS,
}: {
  entries: TimeEntry[];
  activeTimer: { startMs: number } | null;
  /** "HH:mm" — início do expediente. */
  workStart: string;
  /** "HH:mm" — fim do expediente. */
  workEnd: string;
  now: Date;
  minGapMs?: number;
}): DayTimelineResult {
  const nowMs = now.getTime();
  const workStartMs = parseHourMinute(workStart, now);
  const workEndMs = Math.max(parseHourMinute(workEnd, now), workStartMs + HOUR_MS);

  // Intervalos ocupados, ordenados por início.
  const occupied: TimelineBlock[] = entries
    .map((entry) => ({
      kind: "entry" as const,
      startMs: entry.startTime.toMillis(),
      endMs: entry.endTime.toMillis(),
      entry,
    }))
    .filter((block) => block.endMs > block.startMs);
  if (activeTimer) {
    occupied.push({
      kind: "active",
      startMs: activeTimer.startMs,
      endMs: Math.max(nowMs, activeTimer.startMs),
    });
  }
  occupied.sort((a, b) => a.startMs - b.startMs);

  // União dos intervalos ocupados (mescla sobreposições) — usada só para
  // calcular lacunas; os blocos são renderizados individualmente.
  const union: Array<{ startMs: number; endMs: number }> = [];
  for (const block of occupied) {
    const last = union[union.length - 1];
    if (last && block.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, block.endMs);
    } else {
      union.push({ startMs: block.startMs, endMs: block.endMs });
    }
  }

  // Lacunas: janela do expediente até "agora" (não sugerir preencher o futuro).
  const gapWindowEnd = Math.min(nowMs, workEndMs);
  const gaps: TimelineBlock[] = [];
  let cursor = workStartMs;
  for (const span of union) {
    if (span.startMs > cursor && span.startMs - cursor >= minGapMs && cursor < gapWindowEnd) {
      gaps.push({ kind: "gap", startMs: cursor, endMs: Math.min(span.startMs, gapWindowEnd) });
    }
    cursor = Math.max(cursor, span.endMs);
  }
  if (gapWindowEnd - cursor >= minGapMs) {
    gaps.push({ kind: "gap", startMs: cursor, endMs: gapWindowEnd });
  }

  // Eixo: cobre expediente + tudo que foi registrado fora dele.
  const allStarts = [workStartMs, ...union.map((s) => s.startMs)];
  const allEnds = [workEndMs, ...union.map((s) => s.endMs), activeTimer ? nowMs : workEndMs];
  const axisStartMs = floorToHour(Math.min(...allStarts));
  const axisEndMs = ceilToHour(Math.max(...allEnds));

  const hourTicks: number[] = [];
  for (let tick = axisStartMs; tick <= axisEndMs; tick += HOUR_MS) {
    hourTicks.push(tick);
  }

  const blocks = [...occupied, ...gaps].sort((a, b) => a.startMs - b.startMs);
  return { blocks, axisStartMs, axisEndMs, hourTicks };
}
