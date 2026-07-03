"use client";

import { useActiveTimer } from "@/hooks/use-active-timer";
import { useActionTypes } from "@/hooks/use-action-types";
import { CategoryIcon } from "@/lib/icons";
import { formatClock } from "@/lib/time/format";
import { categoryColor } from "@/lib/palette";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ActiveTimerIndicator({ compact = false }: { compact?: boolean }) {
  const { activeTimer, elapsedSeconds } = useActiveTimer();
  const { actionTypesById } = useActionTypes();

  if (!activeTimer) return null;

  const actionType = actionTypesById.get(activeTimer.actionTypeId);
  const color = categoryColor(actionType?.colorTag);
  const label = actionType?.name ?? "Cronômetro";

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <div className="flex w-full flex-col items-center gap-1 rounded-lg border px-2 py-2">
              <CategoryIcon icon={actionType?.icon} className="h-4 w-4 shrink-0" style={{ color }} />
              <span className="font-mono text-[11px] tabular-nums">{formatClock(elapsedSeconds)}</span>
            </div>
          }
        />
        <TooltipContent side="right">
          {label} · {formatClock(elapsedSeconds)}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm">
      <CategoryIcon icon={actionType?.icon} className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span className={cn("min-w-0 flex-1 truncate")}>{label}</span>
      <span className="shrink-0 font-mono tabular-nums">{formatClock(elapsedSeconds)}</span>
    </div>
  );
}
