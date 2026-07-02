"use client";

import { CategoryIcon, ICON_KEYS } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {ICON_KEYS.map((key) => {
        const isSelected = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={key}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <CategoryIcon icon={key} className="h-4.5 w-4.5" />
          </button>
        );
      })}
    </div>
  );
}
