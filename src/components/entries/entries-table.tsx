"use client";

import { ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/lib/icons";
import { categoryColor } from "@/lib/palette";
import { formatDateTimeLabel, formatDuration } from "@/lib/time/format";
import type { ActionType, TimeEntry } from "@/lib/types";

export function EntriesTable({
  entries,
  actionTypesById,
  onDelete,
  onToggleTaskCreated,
}: {
  entries: TimeEntry[];
  actionTypesById: Map<string, ActionType>;
  onDelete: (id: string) => void;
  onToggleTaskCreated: (id: string, value: boolean) => void;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro no período selecionado.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Categoria</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Task criada</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const actionType = actionTypesById.get(entry.actionTypeId);
            const color = actionType ? categoryColor(actionType.colorTag) : categoryColor(undefined);
            return (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)` }}
                    >
                      <CategoryIcon icon={actionType?.icon} className="h-3.5 w-3.5" style={{ color }} />
                    </span>
                    {actionType ? actionType.name : `${entry.actionTypeName} (excluída)`}
                  </div>
                </TableCell>
                <TableCell>{formatDateTimeLabel(entry.startTime.toDate())}</TableCell>
                <TableCell>{formatDuration(entry.durationSeconds)}</TableCell>
                <TableCell className="capitalize">
                  {entry.source === "timer" ? "Cronômetro" : "Manual"}
                </TableCell>
                <TableCell>
                  {entry.movideskLink || entry.jiraLink ? (
                    <div className="flex flex-col gap-0.5">
                      {entry.movideskLink && (
                        <a
                          href={entry.movideskLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Movidesk <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {entry.jiraLink && (
                        <a
                          href={entry.jiraLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Jira <ExternalLink className="h-3 w-3" />
                        </a>
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
                  <Button size="sm" variant="ghost" onClick={() => onDelete(entry.id)}>
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
