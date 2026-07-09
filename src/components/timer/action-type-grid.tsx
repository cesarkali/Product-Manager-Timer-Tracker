"use client";

import { useEffect } from "react";
import { CategoryIcon } from "@/lib/icons";
import { categoryColor } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { ActionType } from "@/lib/types";

function ActionTypeCard({
  actionType,
  isActive,
  disabled,
  shortcutKey,
  animationDelayMs,
  onSelect,
}: {
  actionType: ActionType;
  isActive: boolean;
  disabled?: boolean;
  shortcutKey?: number;
  /** Entrada escalonada do grid (stagger). */
  animationDelayMs?: number;
  onSelect: (actionType: ActionType) => void;
}) {
  const color = categoryColor(actionType.colorTag);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(actionType)}
      className={cn(
        "group relative flex min-h-32 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border bg-card p-4 text-center shadow-sm transition-all",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-300",
        "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        isActive && "ring-2 ring-offset-2 ring-offset-background"
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${color} 8%, var(--card))`,
        animationDelay: `${animationDelayMs ?? 0}ms`,
        ...(isActive ? ({ ["--tw-ring-color" as string]: color }) : undefined),
      }}
    >
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: color }} />
      {shortcutKey != null && (
        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-md bg-foreground/10 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {shortcutKey}
        </span>
      )}
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105"
        style={{ backgroundColor: `color-mix(in oklch, ${color} 24%, transparent)` }}
      >
        <CategoryIcon icon={actionType.icon} className="h-7 w-7" style={{ color }} />
      </span>
      <span className="text-sm leading-snug font-medium">{actionType.name}</span>
    </button>
  );
}

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
  const byShortcut = new Map<number, ActionType>();
  for (const actionType of actionTypes) {
    if (actionType.shortcutKey != null) byShortcut.set(actionType.shortcutKey, actionType);
  }

  useEffect(() => {
    if (disabled) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      const key = Number(e.key);
      const match = byShortcut.get(key);
      if (match) onSelect(match);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, actionTypes.map((a) => `${a.id}:${a.shortcutKey}`).join(",")]);

  if (actionTypes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma categoria cadastrada ainda. Crie uma em Configurações → Categorias.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {actionTypes.map((actionType, index) => (
        <ActionTypeCard
          key={actionType.id}
          actionType={actionType}
          isActive={actionType.id === activeActionTypeId}
          disabled={disabled}
          shortcutKey={actionType.shortcutKey ?? undefined}
          animationDelayMs={Math.min(index * 40, 400)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
