"use client";

import { ListChecks, Timer } from "lucide-react";
import { formatDuration } from "@/lib/time/format";
import type { TimeEntry } from "@/lib/types";

/** Linha compacta com o total do dia: tempo registrado (incluindo o cronômetro
 * em andamento) e número de registros. */
export function DaySummary({
  entries,
  activeElapsedSeconds,
}: {
  /** Registros de hoje. */
  entries: TimeEntry[];
  /** Segundos do cronômetro em andamento (0 se não houver). */
  activeElapsedSeconds: number;
}) {
  const recordedSeconds = entries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
  const totalSeconds = recordedSeconds + activeElapsedSeconds;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Timer className="h-4 w-4" />
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {formatDuration(totalSeconds)}
        </span>
        registradas hoje
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ListChecks className="h-4 w-4" />
        <span className="font-semibold text-foreground">{entries.length}</span>
        {entries.length === 1 ? "registro" : "registros"}
      </span>
    </div>
  );
}
