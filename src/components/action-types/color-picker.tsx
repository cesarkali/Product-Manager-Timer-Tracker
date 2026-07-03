"use client";

import { CATEGORY_PALETTE } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (colorTag: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CATEGORY_PALETTE.map((slot, index) => {
        const colorTag = String(index);
        const isSelected = colorTag === value;
        return (
          <button
            key={colorTag}
            type="button"
            onClick={() => onChange(colorTag)}
            aria-label={`Cor ${index + 1}`}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-transform",
              isSelected ? "border-foreground scale-105" : "border-transparent hover:scale-105"
            )}
            style={{ backgroundColor: slot.dark }}
          />
        );
      })}
    </div>
  );
}
