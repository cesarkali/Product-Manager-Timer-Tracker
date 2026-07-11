"use client";

import { ExternalLink, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CategoryIcon } from "@/lib/icons";
import { categoryColor } from "@/lib/palette";
import { formatDateTimeLabel, formatDuration } from "@/lib/time/format";
import { TASK_TYPE_LABELS, type ActionType, type TimeEntry } from "@/lib/types";

const TOOLTIP_NOTES_LIMIT = 300;

function truncateForTooltip(text: string): string {
  return text.length > TOOLTIP_NOTES_LIMIT
    ? `${text.slice(0, TOOLTIP_NOTES_LIMIT).trimEnd()}…`
    : text;
}

export function EntriesTable({
  entries,
  actionTypesById,
  onDelete,
  onToggleTaskCreated,
  onEdit,
}: {
  entries: TimeEntry[];
  actionTypesById: Map<string, ActionType>;
  onDelete: (id: string) => void;
  onToggleTaskCreated: (id: string, value: boolean) => void;
  onEdit: (entry: TimeEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum registro no período selecionado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Categoria
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Início
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Fim
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Duração
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Origem
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Tasks
            </TableHead>
            <TableHead className="w-full text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Descrição
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Task criada
            </TableHead>
            <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const actionType = actionTypesById.get(entry.actionTypeId);
            const color = actionType ? categoryColor(actionType.colorTag) : categoryColor(undefined);
            const tasks = entry.tasks ?? [];
            return (
              <TableRow key={entry.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)` }}
                    >
                      <CategoryIcon icon={actionType?.icon} className="h-3.5 w-3.5" style={{ color }} />
                    </span>
                    <span className="font-medium">
                      {actionType ? actionType.name : `${entry.actionTypeName} (excluída)`}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTimeLabel(entry.startTime.toDate())}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTimeLabel(entry.endTime.toDate())}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-medium tabular-nums">
                    {formatDuration(entry.durationSeconds)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={entry.source === "timer" ? "default" : "outline"}>
                    {entry.source === "timer" ? "Cronômetro" : "Manual"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tasks.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {tasks.map((task, index) =>
                        task.reference.startsWith("http") ? (
                          <a
                            key={index}
                            href={task.reference}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {TASK_TYPE_LABELS[task.type]} <ExternalLink className="h-3 w-3" />
                            <Badge variant="outline">SP {task.storyPoints}</Badge>
                          </a>
                        ) : (
                          <div key={index} className="inline-flex items-center gap-1">
                            {TASK_TYPE_LABELS[task.type]}: {task.reference}
                            <Badge variant="outline">SP {task.storyPoints}</Badge>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {entry.description || entry.notes ? (
                    <div className="flex max-w-64 flex-col gap-0.5">
                      {entry.description && (
                        <button
                          type="button"
                          onClick={() => onEdit(entry)}
                          className="block truncate text-left font-medium hover:underline"
                          title={entry.description}
                        >
                          {entry.description}
                        </button>
                      )}
                      {entry.notes && (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                onClick={() => onEdit(entry)}
                                className="block max-w-48 truncate text-left text-xs text-muted-foreground hover:underline"
                              />
                            }
                          >
                            {entry.notes}
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64 flex-col items-start whitespace-pre-wrap">
                            {truncateForTooltip(entry.notes)}
                            {entry.notes.length > TOOLTIP_NOTES_LIMIT && (
                              <span className="mt-1 block text-[10px] font-normal text-background/70">
                                Clique para ver o comentário completo.
                              </span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <button onClick={() => onToggleTaskCreated(entry.id, !entry.taskCreated)}>
                    <Badge variant={entry.taskCreated ? "default" : "outline"}>
                      {entry.taskCreated ? "Sim" : "Não"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(entry)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(entry.id)}>
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
