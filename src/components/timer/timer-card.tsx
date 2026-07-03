"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LinkedTasksEditor } from "@/components/shared/linked-tasks-editor";
import { CategoryIcon } from "@/lib/icons";
import { categoryColor } from "@/lib/palette";
import { formatClockWithMillis } from "@/lib/time/format";
import type { ActionType, LinkedTask } from "@/lib/types";
import type { ActiveTimerFields } from "@/hooks/use-active-timer";

const NOTES_MAX_LENGTH = 1000;

/** Atualiza o texto do relógio via requestAnimationFrame direto no DOM (sem
 * setState a cada frame) — puramente decorativo, não afeta o tempo persistido.
 * Congela (sem rAF) enquanto pausado, mostrando o tempo acumulado até a pausa. */
function useLiveClockText(
  startTimeMs: number | null,
  pausedAtMs: number | null,
  accumulatedPausedMs: number
) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (startTimeMs == null) return;
    if (pausedAtMs != null) {
      if (ref.current) {
        ref.current.textContent = formatClockWithMillis(
          Math.max(0, pausedAtMs - startTimeMs - accumulatedPausedMs)
        );
      }
      return;
    }
    let frameId: number;
    function tick() {
      if (ref.current) {
        ref.current.textContent = formatClockWithMillis(
          Math.max(0, Date.now() - startTimeMs! - accumulatedPausedMs)
        );
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [startTimeMs, pausedAtMs, accumulatedPausedMs]);

  return ref;
}

export function TimerCard({
  actionType,
  startTimeMs,
  pausedAtMs,
  accumulatedPausedSeconds,
  fields,
  onStop,
  onPause,
  onResume,
  onFieldsChange,
}: {
  actionType: ActionType | null;
  startTimeMs: number | null;
  pausedAtMs: number | null;
  accumulatedPausedSeconds: number;
  fields: ActiveTimerFields;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onFieldsChange: (patch: Partial<ActiveTimerFields>) => void;
}) {
  const color = actionType ? categoryColor(actionType.colorTag) : undefined;
  const isPaused = pausedAtMs != null;
  const clockRef = useLiveClockText(
    actionType ? startTimeMs : null,
    actionType ? pausedAtMs : null,
    accumulatedPausedSeconds * 1000
  );

  // Reseta os campos ao trocar de categoria ativa (padrão React de "ajustar
  // estado durante o render" em vez de useEffect, evita cascata de renders).
  const [trackedActionTypeId, setTrackedActionTypeId] = useState(actionType?.id);
  const [tasksValue, setTasksValue] = useState<LinkedTask[]>(fields.tasks ?? []);
  const [commentsValue, setCommentsValue] = useState(fields.comments ?? "");
  if (trackedActionTypeId !== actionType?.id) {
    setTrackedActionTypeId(actionType?.id);
    setTasksValue(fields.tasks ?? []);
    setCommentsValue(fields.comments ?? "");
  }

  const tasksDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function commitTasks(next: LinkedTask[]) {
    setTasksValue(next);
    if (tasksDebounceRef.current) clearTimeout(tasksDebounceRef.current);
    tasksDebounceRef.current = setTimeout(() => {
      onFieldsChange({ tasks: next });
    }, 400);
  }

  return (
    <Card
      className="relative overflow-hidden border-2 py-10"
      style={color ? { borderColor: `color-mix(in oklch, ${color} 55%, transparent)` } : undefined}
    >
      {color && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ background: `radial-gradient(circle at 15% 20%, ${color}, transparent 60%)` }}
        />
      )}
      <CardContent className="relative flex flex-col items-center gap-6 text-center">
        {actionType ? (
          <>
            <div className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
              <CategoryIcon icon={actionType.icon} className="h-4 w-4 shrink-0" style={{ color }} />
              {actionType.name}
              {isPaused && (
                <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Pausado
                </span>
              )}
            </div>
            <p
              ref={clockRef}
              className="font-mono text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl data-[paused=true]:opacity-50"
              data-paused={isPaused}
            >
              00:00:00.00
            </p>

            <div className="flex w-full max-w-2xl flex-col gap-3 text-left">
              <LinkedTasksEditor
                items={tasksValue}
                onAdd={() =>
                  commitTasks([...tasksValue, { type: "jira", reference: "", storyPoints: 0 }])
                }
                onRemove={(index) => commitTasks(tasksValue.filter((_, i) => i !== index))}
                onChangeItem={(index, patch) =>
                  commitTasks(tasksValue.map((item, i) => (i === index ? { ...item, ...patch } : item)))
                }
              />

              <div className="flex items-start gap-2">
                <MessageSquare className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <Textarea
                    placeholder="Comentários (opcional)"
                    value={commentsValue}
                    onChange={(e) => setCommentsValue(e.target.value)}
                    onBlur={() => onFieldsChange({ comments: commentsValue })}
                    rows={4}
                    maxLength={NOTES_MAX_LENGTH}
                    className="resize-y"
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {commentsValue.length}/{NOTES_MAX_LENGTH}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {isPaused ? (
                <Button variant="outline" size="lg" onClick={onResume} className="min-w-40 gap-2">
                  <Play className="h-4 w-4" />
                  Retomar
                </Button>
              ) : (
                <Button variant="outline" size="lg" onClick={onPause} className="min-w-40 gap-2">
                  <Pause className="h-4 w-4" />
                  Pausar
                </Button>
              )}
              <Button variant="destructive" size="lg" onClick={onStop} className="min-w-40">
                Parar
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-6xl font-semibold tabular-nums tracking-tight text-muted-foreground/40 sm:text-7xl">
              00:00:00.00
            </p>
            <p className="text-sm text-muted-foreground">
              Nenhum cronômetro rodando. Escolha uma categoria abaixo para começar.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
