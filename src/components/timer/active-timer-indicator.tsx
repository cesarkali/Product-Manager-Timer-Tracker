"use client";

import { useActiveTimer } from "@/hooks/use-active-timer";
import { useActionTypes } from "@/hooks/use-action-types";
import { CategoryIcon } from "@/lib/icons";
import { formatClock } from "@/lib/time/format";
import { categoryColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function ActiveTimerIndicator({ compact = false }: { compact?: boolean }) {
  const { activeTimer, elapsedSeconds } = useActiveTimer();
  const { actionTypesById } = useActionTypes();

  if (!activeTimer) return null;

  const actionType = actionTypesById.get(activeTimer.actionTypeId);
  const color = categoryColor(actionType?.colorTag);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
        !compact && "w-full"
      )}
    >
      <CategoryIcon icon={actionType?.icon} className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      {!compact && (
        <span className="flex-1 truncate">{actionType?.name ?? "Cronômetro"}</span>
      )}
      <span className="font-mono tabular-nums">{formatClock(elapsedSeconds)}</span>
    </div>
  );
}
