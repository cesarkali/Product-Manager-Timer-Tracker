"use client";

import { CategoryIcon } from "@/lib/icons";
import { categoryColor } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { ActionType } from "@/lib/types";

export function ActionTypeGrid({
  actionTypes,
  activeActionTypeId,
  onSelect,
  disabled,
}: {
  actionTypes: ActionType[];
  activeActionTypeId: string | null | undefined;
  onSelect: (actionType: ActionType) => void;
  disabled?: boolean;
}) {
  if (actionTypes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma categoria cadastrada ainda. Crie uma em Configurações → Categorias.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {actionTypes.map((actionType) => {
        const isActive = actionType.id === activeActionTypeId;
        const color = categoryColor(actionType.colorTag);
        return (
          <button
            key={actionType.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(actionType)}
            className={cn(
              "group flex min-h-28 flex-col justify-between gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-all",
              "hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50",
              isActive && "ring-2 ring-offset-2 ring-offset-background"
            )}
            style={isActive ? ({ ["--tw-ring-color" as string]: color }) : undefined}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
              style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)` }}
            >
              <CategoryIcon icon={actionType.icon} className="h-4.5 w-4.5" style={{ color }} />
            </span>
            <span className="text-sm leading-snug font-medium">{actionType.name}</span>
          </button>
        );
      })}
    </div>
  );
}
