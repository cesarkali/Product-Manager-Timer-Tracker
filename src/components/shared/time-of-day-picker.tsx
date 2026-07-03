"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TimeOfDay {
  hours: number;
  minutes: number;
  seconds: number;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function TimeColumn({
  label,
  max,
  value,
  onChange,
}: {
  label: string;
  max: number;
  value: number | null;
  onChange: (v: number) => void;
}) {
  function scrollActiveIntoView(node: HTMLButtonElement | null) {
    const container = node?.parentElement;
    if (!node || !container) return;
    container.scrollTop = node.offsetTop - container.clientHeight / 2 + node.clientHeight / 2;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="h-56 w-14 overflow-y-auto rounded-md border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: max + 1 }, (_, n) => n).map((n) => (
          <button
            key={n}
            ref={value === n ? scrollActiveIntoView : undefined}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex h-8 w-full items-center justify-center text-sm transition-colors",
              value === n
                ? "bg-primary font-medium text-primary-foreground"
                : "text-foreground hover:bg-accent"
            )}
          >
            {pad(n)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TimeOfDayPicker({
  value,
  onChange,
  placeholder = "Escolher horário",
}: {
  value: TimeOfDay | null;
  onChange: (value: TimeOfDay) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TimeOfDay>(value ?? { hours: 0, minutes: 0, seconds: 0 });

  // Ressincroniza o rascunho com o valor externo sempre que o popover reabre
  // (ajuste de estado durante o render em vez de useEffect).
  const [trackedOpen, setTrackedOpen] = useState(open);
  if (trackedOpen !== open) {
    setTrackedOpen(open);
    if (open) setDraft(value ?? { hours: 0, minutes: 0, seconds: 0 });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="w-full justify-start gap-2 font-normal">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            {value ? `${pad(value.hours)}:${pad(value.minutes)}:${pad(value.seconds)}` : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-3">
        <div className="flex gap-2">
          <TimeColumn
            label="Hora"
            max={23}
            value={draft.hours}
            onChange={(hours) => setDraft((d) => ({ ...d, hours }))}
          />
          <TimeColumn
            label="Min"
            max={59}
            value={draft.minutes}
            onChange={(minutes) => setDraft((d) => ({ ...d, minutes }))}
          />
          <TimeColumn
            label="Seg"
            max={59}
            value={draft.seconds}
            onChange={(seconds) => setDraft((d) => ({ ...d, seconds }))}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => {
            const now = new Date();
            setDraft({ hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds() });
          }}
        >
          Agora
        </Button>
        <Button
          type="button"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            onChange(draft);
            setOpen(false);
          }}
        >
          Confirmar
        </Button>
      </PopoverContent>
    </Popover>
  );
}
