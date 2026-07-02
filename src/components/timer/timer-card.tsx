"use client";

import { useState } from "react";
import { Link2, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/lib/icons";
import { categoryColor } from "@/lib/palette";
import { formatClock } from "@/lib/time/format";
import type { ActionType } from "@/lib/types";
import type { ActiveTimerFields } from "@/hooks/use-active-timer";

export function TimerCard({
  actionType,
  elapsedSeconds,
  fields,
  onStop,
  onFieldsChange,
}: {
  actionType: ActionType | null;
  elapsedSeconds: number;
  fields: ActiveTimerFields;
  onStop: () => void;
  onFieldsChange: (patch: Partial<ActiveTimerFields>) => void;
}) {
  const color = actionType ? categoryColor(actionType.colorTag) : undefined;

  // Reseta os campos ao trocar de categoria ativa (padrão React de "ajustar
  // estado durante o render" em vez de useEffect, evita cascata de renders).
  const [trackedActionTypeId, setTrackedActionTypeId] = useState(actionType?.id);
  const [movideskValue, setMovideskValue] = useState(fields.movideskLink ?? "");
  const [jiraValue, setJiraValue] = useState(fields.jiraLink ?? "");
  const [commentsValue, setCommentsValue] = useState(fields.comments ?? "");
  if (trackedActionTypeId !== actionType?.id) {
    setTrackedActionTypeId(actionType?.id);
    setMovideskValue(fields.movideskLink ?? "");
    setJiraValue(fields.jiraLink ?? "");
    setCommentsValue(fields.comments ?? "");
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
            </div>
            <p className="font-mono text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl">
              {formatClock(elapsedSeconds)}
            </p>

            <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Link do Movidesk (opcional)"
                  value={movideskValue}
                  onChange={(e) => setMovideskValue(e.target.value)}
                  onBlur={() => onFieldsChange({ movideskLink: movideskValue })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onFieldsChange({ movideskLink: movideskValue });
                      e.currentTarget.blur();
                    }
                  }}
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Link do Jira (opcional)"
                  value={jiraValue}
                  onChange={(e) => setJiraValue(e.target.value)}
                  onBlur={() => onFieldsChange({ jiraLink: jiraValue })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onFieldsChange({ jiraLink: jiraValue });
                      e.currentTarget.blur();
                    }
                  }}
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Comentários (opcional)"
                  value={commentsValue}
                  onChange={(e) => setCommentsValue(e.target.value)}
                  onBlur={() => onFieldsChange({ comments: commentsValue })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onFieldsChange({ comments: commentsValue });
                      e.currentTarget.blur();
                    }
                  }}
                  className="h-9"
                />
              </div>
            </div>

            <Button variant="destructive" size="lg" onClick={onStop} className="min-w-40">
              Parar
            </Button>
          </>
        ) : (
          <>
            <p className="font-mono text-6xl font-semibold tabular-nums tracking-tight text-muted-foreground/40 sm:text-7xl">
              00:00
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
