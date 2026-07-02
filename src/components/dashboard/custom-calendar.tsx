"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export interface DateSpan {
  start: Date;
  end: Date;
}

/**
 * Calendário de seleção de intervalo construído do zero (sem lib de calendário pronta).
 * Primeiro clique marca o início, segundo clique marca o fim (ordem é normalizada).
 */
export function CustomCalendar({
  value,
  onChange,
  maxDate = new Date(),
}: {
  value: DateSpan | null;
  onChange: (span: DateSpan) => void;
  maxDate?: Date;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => value?.end ?? new Date());
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [visibleMonth]);

  const previewEnd = pendingStart && hoverDate ? hoverDate : null;
  const previewSpan =
    pendingStart && previewEnd
      ? {
          start: isBefore(previewEnd, pendingStart) ? previewEnd : pendingStart,
          end: isBefore(previewEnd, pendingStart) ? pendingStart : previewEnd,
        }
      : null;

  function handleDayClick(day: Date) {
    if (isAfter(day, maxDate)) return;

    if (!pendingStart) {
      setPendingStart(day);
      return;
    }

    const start = isBefore(day, pendingStart) ? day : pendingStart;
    const end = isBefore(day, pendingStart) ? pendingStart : day;
    onChange({ start, end });
    setPendingStart(null);
    setHoverDate(null);
  }

  const activeSpan = previewSpan ?? value;

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
          disabled={isAfter(startOfMonth(addMonths(visibleMonth, 1)), maxDate)}
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
          const isFuture = isAfter(day, maxDate);
          const isToday = isSameDay(day, new Date());
          const isRangeEdge =
            activeSpan && (isSameDay(day, activeSpan.start) || isSameDay(day, activeSpan.end));
          const isInRange =
            activeSpan &&
            !isSameDay(activeSpan.start, activeSpan.end) &&
            isWithinInterval(day, { start: activeSpan.start, end: activeSpan.end });
          const isPendingStart = pendingStart && isSameDay(day, pendingStart);

          return (
            <div key={day.toISOString()} className="flex items-center justify-center py-0.5">
              <button
                type="button"
                disabled={isFuture}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoverDate(day)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors",
                  !inCurrentMonth && "text-muted-foreground/40",
                  inCurrentMonth && !isRangeEdge && "text-foreground hover:bg-accent",
                  isInRange && !isRangeEdge && "rounded-none bg-accent",
                  isRangeEdge && "bg-primary font-medium text-primary-foreground",
                  isPendingStart && !isRangeEdge && "bg-primary text-primary-foreground",
                  isToday && !isRangeEdge && "ring-1 ring-inset ring-primary/50",
                  isFuture && "cursor-not-allowed opacity-30"
                )}
              >
                {format(day, "d")}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        {pendingStart ? "Escolha a data final" : "Escolha a data inicial"}
      </p>
    </div>
  );
}
