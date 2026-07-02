"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { IconPicker } from "@/components/action-types/icon-picker";
import { CategoryIcon } from "@/lib/icons";
import { categoryColor } from "@/lib/palette";
import type { ActionType } from "@/lib/types";

export function ActionTypeTable({
  actionTypes,
  onRename,
  onIconChange,
  onArchiveToggle,
  onDelete,
}: {
  actionTypes: ActionType[];
  onRename: (id: string, name: string) => Promise<void>;
  onIconChange: (id: string, icon: string) => Promise<void>;
  onArchiveToggle: (id: string, archived: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (actionTypes.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Categoria</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {actionTypes.map((actionType) => {
          const color = categoryColor(actionType.colorTag);
          return (
            <TableRow key={actionType.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-accent"
                          style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)` }}
                          title="Trocar ícone"
                        >
                          <CategoryIcon icon={actionType.icon} className="h-4 w-4" style={{ color }} />
                        </button>
                      }
                    />
                    <PopoverContent className="w-auto">
                      <IconPicker
                        value={actionType.icon}
                        onChange={(icon) => onIconChange(actionType.id, icon)}
                      />
                    </PopoverContent>
                  </Popover>
                  {editingId === actionType.id ? (
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && editingName.trim()) {
                          await onRename(actionType.id, editingName.trim());
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8"
                    />
                  ) : (
                    <button
                      className="text-left hover:underline"
                      onClick={() => {
                        setEditingId(actionType.id);
                        setEditingName(actionType.name);
                      }}
                    >
                      {actionType.name}
                    </button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={actionType.archived ? "secondary" : "outline"}>
                  {actionType.archived ? "Arquivada" : "Ativa"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onArchiveToggle(actionType.id, !actionType.archived)}
                  >
                    {actionType.archived ? "Reativar" : "Arquivar"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button size="sm" variant="destructive">
                          Excluir
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir &quot;{actionType.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Os registros de tempo já lançados nessa categoria não serão apagados —
                          eles vão continuar aparecendo com o nome atual, mas em cinza, indicando
                          categoria excluída. Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(actionType.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
