"use client";

import { ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/time/format";
import { TASK_TYPE_LABELS, type LinkedTask } from "@/lib/types";

export interface TaskAggregate {
  /** Referência original (primeira ocorrência); agrupamento é case-insensitive. */
  reference: string;
  type: LinkedTask["type"];
  /** Soma da duração integral de cada registro que vincula a task. */
  totalSeconds: number;
  /** Número de registros (sessões de trabalho) que tocaram a task. */
  sessions: number;
  /** Story points da task (máximo entre as ocorrências, evita somar 2x). */
  storyPoints: number;
}

/** Evidência direta de "entreguei X tasks": cada task trabalhada no período,
 * com o tempo somado e o número de sessões. */
export function TaskTimeTable({ data }: { data: TaskAggregate[] }) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhuma task vinculada no período.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-full text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Task
              </TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Tipo
              </TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Tempo
              </TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Sessões
              </TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Pontos
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((task) => (
              <TableRow key={`${task.type}:${task.reference.toLowerCase()}`}>
                <TableCell className="max-w-96">
                  {task.reference.startsWith("http") ? (
                    <a
                      href={task.reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 text-primary hover:underline"
                    >
                      <span className="truncate">{task.reference}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="block truncate" title={task.reference}>
                      {task.reference}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{TASK_TYPE_LABELS[task.type]}</Badge>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-medium tabular-nums">
                    {formatDuration(task.totalSeconds)}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{task.sessions}</TableCell>
                <TableCell className="tabular-nums">
                  {task.storyPoints > 0 ? task.storyPoints : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Registros com várias tasks vinculadas contam o tempo integral para cada uma.
      </p>
    </div>
  );
}
