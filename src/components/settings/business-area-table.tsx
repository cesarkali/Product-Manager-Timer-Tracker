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
import { ColorPicker } from "@/components/action-types/color-picker";
import { categoryColor } from "@/lib/palette";
import type { BusinessArea } from "@/lib/types";

/** Tabela de áreas de negócio — mesmo padrão visual/interação da tabela de
 * categorias (cor via popover, nome editável no clique, arquivar/excluir). */
export function BusinessAreaTable({
  businessAreas,
  onRename,
  onColorChange,
  onArchiveToggle,
  onDelete,
}: {
  businessAreas: BusinessArea[];
  onRename: (id: string, name: string) => Promise<void>;
  onColorChange: (id: string, colorTag: string) => Promise<void>;
  onArchiveToggle: (id: string, archived: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (businessAreas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma área cadastrada ainda.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cor</TableHead>
          <TableHead className="w-full">Área</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {businessAreas.map((area) => {
          const color = categoryColor(area.colorTag);
          return (
            <TableRow key={area.id}>
              <TableCell>
                <Popover>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-accent"
                        title="Trocar cor"
                      >
                        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                      </button>
                    }
                  />
                  <PopoverContent className="w-auto">
                    <ColorPicker
                      value={area.colorTag ?? "0"}
                      onChange={(colorTag) => onColorChange(area.id, colorTag)}
                    />
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                {editingId === area.id ? (
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={async () => {
                      if (editingName.trim() && editingName.trim() !== area.name) {
                        await onRename(area.id, editingName.trim());
                      }
                      setEditingId(null);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && editingName.trim()) {
                        await onRename(area.id, editingName.trim());
                        setEditingId(null);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-8 max-w-64"
                  />
                ) : (
                  <button
                    className="text-left hover:underline"
                    onClick={() => {
                      setEditingId(area.id);
                      setEditingName(area.name);
                    }}
                  >
                    {area.name}
                  </button>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={area.archived ? "secondary" : "outline"}>
                  {area.archived ? "Arquivada" : "Ativa"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onArchiveToggle(area.id, !area.archived)}
                  >
                    {area.archived ? "Reativar" : "Arquivar"}
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
                        <AlertDialogTitle>Excluir &quot;{area.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Categorias que usam essa área voltam para &quot;Sem área&quot; — nada é
                          apagado, e você pode reatribuir a área de volta a qualquer momento na
                          tabela de Categorias. Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(area.id)}>
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
