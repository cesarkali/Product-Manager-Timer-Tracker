"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeOfDayPicker, type TimeOfDay } from "@/components/shared/time-of-day-picker";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const QUICK_OFFSETS_MIN = [5, 10, 15, 30];

/** "Iniciado às HH:mm:ss · ajustar" — corrige o início do cronômetro em
 * andamento para quem esqueceu de ligar na hora ("na real comecei 10 min
 * atrás"): chips de desconto rápido ou horário exato. */
export function StartTimeAdjuster({
  startTimeMs,
  onAdjust,
}: {
  startTimeMs: number;
  /** Retorna false quando o horário é inválido (futuro / depois da pausa). */
  onAdjust: (date: Date) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const startDate = new Date(startTimeMs);
  const startLabel = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}:${pad(startDate.getSeconds())}`;

  async function apply(date: Date) {
    const ok = await onAdjust(date);
    if (ok) {
      setOpen(false);
      toast.success("Início do cronômetro ajustado.");
    } else {
      toast.error("O início precisa ser antes de agora (e antes da pausa, se pausado).");
    }
  }

  function applyTimeOfDay(time: TimeOfDay) {
    // Base = data do startTime atual (cobre cronômetro que virou a madrugada).
    const next = new Date(startTimeMs);
    next.setHours(time.hours, time.minutes, time.seconds, 0);
    void apply(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Iniciado às <span className="font-mono font-medium tabular-nums">{startLabel}</span>
            {" · "}
            <span className="underline underline-offset-2">ajustar</span>
          </button>
        }
      />
      <PopoverContent className="flex w-64 flex-col gap-3 p-3">
        <p className="text-xs text-muted-foreground">
          Esqueceu de ligar na hora? Corrija o início:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_OFFSETS_MIN.map((minutes) => (
            <Button
              key={minutes}
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 font-mono"
              onClick={() => void apply(new Date(startTimeMs - minutes * 60_000))}
            >
              −{minutes}min
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Ou horário exato:</span>
          <TimeOfDayPicker
            value={{
              hours: startDate.getHours(),
              minutes: startDate.getMinutes(),
              seconds: startDate.getSeconds(),
            }}
            onChange={applyTimeOfDay}
            placeholder="Escolher horário"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
