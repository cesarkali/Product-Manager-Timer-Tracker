"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buildDayTimeline, type TimelineBlock } from "@/lib/time/day-timeline";
import { categoryColor } from "@/lib/palette";
import { formatDuration } from "@/lib/time/format";
import type { ActionType, TimeEntry } from "@/lib/types";

function formatHourMinute(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Faixa horizontal do dia: blocos coloridos por categoria, o cronômetro em
 * andamento pulsando e lacunas tracejadas clicáveis (→ lançamento retroativo
 * pré-preenchido). Re-renderiza a cada tick de 1s da página quando há timer
 * ativo (barato: são ~poucas dezenas de divs). */
export function DayTimeline({
  entries,
  actionTypesById,
  activeTimer,
  workStart,
  workEnd,
  onGapClick,
}: {
  /** Registros de hoje. */
  entries: TimeEntry[];
  actionTypesById: Map<string, ActionType>;
  activeTimer: { actionTypeId: string; startMs: number } | null;
  workStart: string;
  workEnd: string;
  onGapClick: (gap: { start: Date; end: Date }) => void;
}) {
  // "Agora" congelado por minuto: evita reposicionar blocos a cada segundo.
  const nowMinute = Math.floor(Date.now() / 60_000);
  const timeline = useMemo(
    () =>
      buildDayTimeline({
        entries,
        activeTimer: activeTimer ? { startMs: activeTimer.startMs } : null,
        workStart,
        workEnd,
        now: new Date(nowMinute * 60_000),
      }),
    [entries, activeTimer, workStart, workEnd, nowMinute]
  );
  const [hoveredGap, setHoveredGap] = useState<TimelineBlock | null>(null);

  const axisSpan = timeline.axisEndMs - timeline.axisStartMs;
  if (axisSpan <= 0) return null;

  const positionOf = (ms: number) =>
    Math.min(100, Math.max(0, ((ms - timeline.axisStartMs) / axisSpan) * 100));

  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-12 overflow-hidden rounded-lg border bg-muted/20">
        {timeline.blocks.map((block, index) => {
          const left = positionOf(block.startMs);
          const width = Math.max(0.4, positionOf(block.endMs) - left);
          const style = { left: `${left}%`, width: `${width}%` };
          const rangeLabel = `${formatHourMinute(block.startMs)}–${formatHourMinute(block.endMs)}`;

          if (block.kind === "gap") {
            return (
              <button
                key={`gap-${index}`}
                type="button"
                onClick={() =>
                  onGapClick({ start: new Date(block.startMs), end: new Date(block.endMs) })
                }
                onMouseEnter={() => setHoveredGap(block)}
                onMouseLeave={() => setHoveredGap(null)}
                aria-label={`Registrar lacuna de ${rangeLabel}`}
                title={`Sem registro de ${rangeLabel} — clique para lançar`}
                className="group absolute inset-y-1.5 flex items-center justify-center rounded-md border border-dashed border-muted-foreground/35 transition-colors hover:border-muted-foreground/70 hover:bg-accent"
                style={style}
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          }

          const actionType =
            block.kind === "active"
              ? undefined
              : block.entry
                ? actionTypesById.get(block.entry.actionTypeId)
                : undefined;
          const color =
            block.kind === "active"
              ? categoryColor(
                  activeTimer ? actionTypesById.get(activeTimer.actionTypeId)?.colorTag : undefined
                )
              : categoryColor(actionType?.colorTag);
          const name =
            block.kind === "active"
              ? (activeTimer && actionTypesById.get(activeTimer.actionTypeId)?.name) ?? "Em andamento"
              : actionType?.name ?? `${block.entry?.actionTypeName ?? "Categoria"} (excluída)`;
          const durationSeconds =
            block.kind === "entry" && block.entry
              ? block.entry.durationSeconds
              : Math.round((block.endMs - block.startMs) / 1000);

          return (
            <Tooltip key={block.kind === "entry" ? block.entry!.id : `active-${index}`}>
              <TooltipTrigger
                render={
                  <div
                    className="absolute inset-y-1.5 rounded-md"
                    style={{
                      ...style,
                      backgroundColor: color,
                      opacity: block.kind === "active" ? undefined : 0.85,
                      animation:
                        block.kind === "active" ? "timer-glow-block 2.5s ease-in-out infinite" : undefined,
                    }}
                  />
                }
              />
              <TooltipContent className="flex-col items-start gap-0.5">
                <span className="font-medium">{name}</span>
                <span className="text-xs opacity-80">
                  {rangeLabel} · {formatDuration(durationSeconds)}
                  {block.kind === "active" && " · em andamento"}
                </span>
                {block.kind === "entry" && block.entry?.description && (
                  <span className="max-w-56 truncate text-xs opacity-80">
                    {block.entry.description}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="relative h-4 text-[10px] tabular-nums text-muted-foreground">
        {timeline.hourTicks.map((tick, index) => {
          // Pula marcas intermediárias quando o eixo é longo, para não amontoar.
          const total = timeline.hourTicks.length;
          const step = total > 14 ? 2 : 1;
          if (index % step !== 0 && index !== total - 1) return null;
          return (
            <span
              key={tick}
              className="absolute -translate-x-1/2"
              style={{ left: `${positionOf(tick)}%` }}
            >
              {new Date(tick).getHours()}h
            </span>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {hoveredGap
          ? `Sem registro de ${formatHourMinute(hoveredGap.startMs)} a ${formatHourMinute(hoveredGap.endMs)} — clique para lançar.`
          : "Clique em uma lacuna tracejada para lançar o que você esqueceu de cronometrar."}
      </p>
    </div>
  );
}
