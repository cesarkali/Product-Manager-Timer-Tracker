"use client";

import { MoveDownRight, MoveUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";
import { formatDuration } from "@/lib/time/format";
import { cn } from "@/lib/utils";

export interface StatTilesPrevious {
  totalSeconds: number;
  entryCount: number;
  taskCreatedPercent: number;
  totalStoryPoints: number;
  secondsPerPoint: number | null;
}

interface StatDefinition {
  label: string;
  /** Valor bruto para animar (null = sem animação, usa fallback). */
  numeric: number | null;
  format: (value: number) => string;
  /** Texto exibido quando numeric é null. */
  fallback?: string;
  /** Variação percentual vs período anterior (null = sem base de comparação). */
  deltaPercent: number | null;
  /** "positive": subir é bom (verde). "neutral": só informativo (cinza). */
  deltaTone: "positive" | "neutral";
}

function deltaPercentOf(current: number, previous: number | null | undefined): number | null {
  if (previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function StatTile({ stat, animationDelayMs = 0 }: { stat: StatDefinition; animationDelayMs?: number }) {
  const animated = useCountUp(stat.numeric ?? 0);
  const display = stat.numeric == null ? (stat.fallback ?? "—") : stat.format(animated);
  const delta = stat.deltaPercent;

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards gap-2 py-6 duration-300 print:gap-1 print:border-border print:py-3 print:shadow-none"
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      <CardContent className="print:px-3">
        <p className="text-sm text-muted-foreground print:text-xs">{stat.label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums print:mt-1 print:text-xl">
          {display}
        </p>
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs tabular-nums",
            delta == null
              ? "text-muted-foreground/50"
              : stat.deltaTone === "positive" && delta > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
          )}
        >
          {delta == null ? (
            "— vs anterior"
          ) : (
            <>
              {delta >= 0 ? (
                <MoveUpRight className="h-3 w-3" />
              ) : (
                <MoveDownRight className="h-3 w-3" />
              )}
              {Math.abs(delta)}% vs anterior
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export function StatTiles({
  totalSeconds,
  entryCount,
  taskCreatedPercent,
  totalStoryPoints,
  secondsPerPoint,
  topArea,
  previous,
}: {
  totalSeconds: number;
  entryCount: number;
  taskCreatedPercent: number;
  totalStoryPoints: number;
  secondsPerPoint: number | null;
  /** Área com mais tempo no período (nome + participação %). */
  topArea?: { name: string; sharePercent: number } | null;
  /** Mesmos números do período imediatamente anterior, para os deltas. */
  previous?: StatTilesPrevious | null;
}) {
  const stats: StatDefinition[] = [
    {
      label: "Tempo total no período",
      numeric: totalSeconds,
      format: (v) => formatDuration(Math.round(v)),
      deltaPercent: deltaPercentOf(totalSeconds, previous?.totalSeconds),
      deltaTone: "positive",
    },
    {
      label: "Registros",
      numeric: entryCount,
      format: (v) => String(Math.round(v)),
      deltaPercent: deltaPercentOf(entryCount, previous?.entryCount),
      deltaTone: "positive",
    },
    {
      label: "Com task criada",
      numeric: taskCreatedPercent,
      format: (v) => `${Math.round(v)}%`,
      deltaPercent: deltaPercentOf(taskCreatedPercent, previous?.taskCreatedPercent),
      deltaTone: "neutral",
    },
    {
      label: "Total de pontos",
      numeric: totalStoryPoints,
      format: (v) => String(Math.round(v)),
      deltaPercent: deltaPercentOf(totalStoryPoints, previous?.totalStoryPoints),
      deltaTone: "positive",
    },
    {
      label: "Tempo por ponto",
      numeric: secondsPerPoint,
      format: (v) => formatDuration(Math.round(v)),
      fallback: "—",
      deltaPercent:
        secondsPerPoint == null ? null : deltaPercentOf(secondsPerPoint, previous?.secondsPerPoint),
      deltaTone: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6 print:grid-cols-6 print:gap-3">
      {stats.map((stat, index) => (
        <StatTile key={stat.label} stat={stat} animationDelayMs={index * 40} />
      ))}
      <Card
        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards gap-2 py-6 duration-300 print:gap-1 print:border-border print:py-3 print:shadow-none"
        style={{ animationDelay: `${stats.length * 40}ms` }}
      >
        <CardContent className="print:px-3">
          <p className="text-sm text-muted-foreground print:text-xs">Área principal</p>
          <p
            className="mt-2 truncate text-xl font-semibold tracking-tight print:mt-1 print:text-base"
            title={topArea?.name}
          >
            {topArea ? topArea.name : "—"}
          </p>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {topArea ? `${topArea.sharePercent}% do tempo` : "sem dados"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
