"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CustomCalendar } from "@/components/dashboard/custom-calendar";
import { formatDayLabel } from "@/lib/time/format";
import { cn } from "@/lib/utils";
import type { DateRange, RangePreset } from "@/lib/time/ranges";

const DEFAULT_PRESETS: { value: Exclude<RangePreset, "custom">; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "month", label: "Este mês" },
  { value: "lastMonth", label: "Mês passado" },
];

export function DateRangeFilter({
  preset,
  customRange,
  onChange,
  onCustomRangeChange,
  presets = DEFAULT_PRESETS,
}: {
  preset: RangePreset;
  customRange: DateRange | null;
  onChange: (preset: Exclude<RangePreset, "custom">) => void;
  onCustomRangeChange: (range: DateRange) => void;
  presets?: { value: Exclude<RangePreset, "custom">; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-1">
      {presets.map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant="outline"
          className={cn(preset === p.value && "bg-accent")}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              size="sm"
              variant="outline"
              className={cn("gap-1.5", preset === "custom" && "bg-accent")}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              {preset === "custom" && customRange
                ? `${formatDayLabel(customRange.start)} – ${formatDayLabel(customRange.end)}`
                : "Período customizado"}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="end">
          <CustomCalendar
            value={customRange}
            onChange={(span) => {
              onCustomRangeChange(span);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
