"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * Grade de calendário de seleção de dia único, construída do zero (sem lib de
 * calendário pronta) — mesmo estilo visual do CustomCalendar (intervalo) do dashboard.
 */
export function CustomDayPicker({
  value,
  onChange,
  maxDate,
}: {
  value: Date | null;
  onChange: (day: Date) => void;
  maxDate?: Date;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => value ?? new Date());

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [visibleMonth]);

  return (
    <div className="w-72 select-none rounded-lg border bg-card p-3 text-card-foreground">
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium capitalize">
          {format(visibleMonth, "MMMM yyyy", { locale: ptBR })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          disabled={maxDate != null && isAfter(startOfMonth(addMonths(visibleMonth, 1)), maxDate)}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inCurrentMonth = isSameMonth(day, visibleMonth);
          const isFuture = maxDate != null && isAfter(day, maxDate);
          const isToday = isSameDay(day, new Date());
          const isSelected = value != null && isSameDay(day, value);

          return (
            <div key={day.toISOString()} className="flex items-center justify-center py-0.5">
              <button
                type="button"
                disabled={isFuture}
                onClick={() => onChange(day)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors",
                  !inCurrentMonth && "text-muted-foreground/40",
                  inCurrentMonth && !isSelected && "text-foreground hover:bg-accent",
                  isSelected && "bg-primary font-medium text-primary-foreground",
                  isToday && !isSelected && "ring-1 ring-inset ring-primary/50",
                  isFuture && "cursor-not-allowed opacity-30"
                )}
              >
                {format(day, "d")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
