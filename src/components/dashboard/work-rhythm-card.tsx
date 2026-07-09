"use client";

import { useMemo } from "react";
import { CalendarDays, Clock3, Gauge, Sunrise } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration, toLocalIsoDate } from "@/lib/time/format";
import type { TimeEntry } from "@/lib/types";

const WEEKDAY_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const HOUR_MS = 60 * 60_000;

/** Faixas do dia para a barra de distribuição — cores de identidade da paleta
 * fixa (azul/água/violeta). */
const DAY_PERIODS = [
  { label: "Manhã", untilHour: 12, color: "#3987e5" },
  { label: "Tarde", untilHour: 18, color: "#199e70" },
  { label: "Noite", untilHour: 24, color: "#9085e9" },
] as const;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatMinutesOfDay(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(Math.round(minutes) % 60)}`;
}

interface RhythmStats {
  totalSeconds: number;
  topWeekday: { label: string; seconds: number } | null;
  peakHour: { hour: number; seconds: number } | null;
  avgPerActiveDay: number | null;
  typicalStart: string | null;
  typicalEnd: string | null;
  periods: { label: string; color: string; seconds: number; percent: number }[];
}

function buildRhythmStats(entries: TimeEntry[]): RhythmStats {
  const weekdaySeconds = Array(7).fill(0) as number[];
  const hourSeconds = Array(24).fill(0) as number[];
  // Primeiro início / último fim de cada dia ativo, em minutos do dia.
  const dayBounds = new Map<string, { startMin: number; endMin: number }>();
  let totalSeconds = 0;

  for (const entry of entries) {
    totalSeconds += entry.durationSeconds;

    // Distribui o intervalo real pelas fronteiras de hora (mesma abordagem do
    // heatmap): é padrão de rotina, não contabilidade — pausas não descontam.
    let cursor = entry.startTime.toMillis();
    const endMs = entry.endTime.toMillis();
    while (cursor < endMs) {
      const cursorDate = new Date(cursor);
      const hourEnd = Math.min(endMs, (Math.floor(cursor / HOUR_MS) + 1) * HOUR_MS);
      const seconds = (hourEnd - cursor) / 1000;
      weekdaySeconds[cursorDate.getDay()] += seconds;
      hourSeconds[cursorDate.getHours()] += seconds;
      cursor = hourEnd;
    }

    const start = entry.startTime.toDate();
    const end = entry.endTime.toDate();
    const dayKey = toLocalIsoDate(start);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    const bounds = dayBounds.get(dayKey);
    if (bounds) {
      bounds.startMin = Math.min(bounds.startMin, startMin);
      bounds.endMin = Math.max(bounds.endMin, endMin);
    } else {
      dayBounds.set(dayKey, { startMin, endMin });
    }
  }

  const topWeekdayIndex = weekdaySeconds.reduce(
    (best, seconds, day) => (seconds > weekdaySeconds[best] ? day : best),
    0
  );
  const peakHourIndex = hourSeconds.reduce(
    (best, seconds, hour) => (seconds > hourSeconds[best] ? hour : best),
    0
  );

  const activeDays = dayBounds.size;
  const allBounds = Array.from(dayBounds.values());
  const avgStartMin =
    activeDays === 0 ? null : allBounds.reduce((s, b) => s + b.startMin, 0) / activeDays;
  const avgEndMin =
    activeDays === 0 ? null : allBounds.reduce((s, b) => s + b.endMin, 0) / activeDays;

  let periodStart = 0;
  const periods = DAY_PERIODS.map(({ label, untilHour, color }) => {
    let seconds = 0;
    for (let hour = periodStart; hour < untilHour; hour++) seconds += hourSeconds[hour];
    periodStart = untilHour;
    return {
      label,
      color,
      seconds,
      percent: totalSeconds === 0 ? 0 : Math.round((seconds / totalSeconds) * 100),
    };
  });

  return {
    totalSeconds,
    topWeekday:
      weekdaySeconds[topWeekdayIndex] > 0
        ? { label: WEEKDAY_FULL[topWeekdayIndex], seconds: Math.round(weekdaySeconds[topWeekdayIndex]) }
        : null,
    peakHour:
      hourSeconds[peakHourIndex] > 0
        ? { hour: peakHourIndex, seconds: Math.round(hourSeconds[peakHourIndex]) }
        : null,
    avgPerActiveDay: activeDays === 0 ? null : Math.round(totalSeconds / activeDays),
    typicalStart: avgStartMin == null ? null : formatMinutesOfDay(avgStartMin),
    typicalEnd: avgEndMin == null ? null : formatMinutesOfDay(avgEndMin),
    periods,
  };
}

function RhythmStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

/** Indicadores de rotina derivados dos mesmos registros do heatmap: dia mais
 * produtivo, horário de pico, média por dia ativo, início/fim típicos e
 * distribuição manhã/tarde/noite. */
export function WorkRhythmCard({ entries }: { entries: TimeEntry[] }) {
  const stats = useMemo(() => buildRhythmStats(entries), [entries]);

  if (stats.totalSeconds === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ritmo de trabalho</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        </CardContent>
      </Card>
    );
  }

  const visiblePeriods = stats.periods.filter((p) => p.seconds > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ritmo de trabalho</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col justify-between gap-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <RhythmStat
            icon={CalendarDays}
            label="Dia mais produtivo"
            value={stats.topWeekday?.label ?? "—"}
            detail={stats.topWeekday ? formatDuration(stats.topWeekday.seconds) : undefined}
          />
          <RhythmStat
            icon={Clock3}
            label="Horário de pico"
            value={stats.peakHour ? `${stats.peakHour.hour}h–${stats.peakHour.hour + 1}h` : "—"}
            detail={stats.peakHour ? formatDuration(stats.peakHour.seconds) : undefined}
          />
          <RhythmStat
            icon={Gauge}
            label="Média por dia ativo"
            value={stats.avgPerActiveDay == null ? "—" : formatDuration(stats.avgPerActiveDay)}
          />
          <RhythmStat
            icon={Sunrise}
            label="Dia típico"
            value={
              stats.typicalStart && stats.typicalEnd
                ? `${stats.typicalStart} → ${stats.typicalEnd}`
                : "—"
            }
            detail="média de início e fim"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Distribuição do tempo no dia</p>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted/40">
            {visiblePeriods.map((period) => (
              <div
                key={period.label}
                style={{ width: `${period.percent}%`, backgroundColor: period.color }}
                title={`${period.label}: ${formatDuration(Math.round(period.seconds))} (${period.percent}%)`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {visiblePeriods.map((period) => (
              <span key={period.label} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: period.color }}
                />
                {period.label} · {period.percent}%
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
