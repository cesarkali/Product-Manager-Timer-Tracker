"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useActionTypes } from "@/hooks/use-action-types";
import { ActionTypeForm } from "@/components/action-types/action-type-form";
import { ActionTypeTable } from "@/components/action-types/action-type-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ActionTypesPage() {
  const {
    actionTypes,
    loading,
    createActionType,
    renameActionType,
    setActionTypeIcon,
    setActionTypeColor,
    setArchived,
    reorderActionTypes,
    deleteActionType,
    restoreDefaultActionTypes,
  } = useActionTypes();
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    try {
      await restoreDefaultActionTypes();
      toast.success("Categorias padrão restauradas.");
    } catch {
      toast.error("Não foi possível restaurar as categorias padrão.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            As atividades recorrentes que você cronometra. Clique no ícone para trocar, na
            bolinha de cor para recolorir, no nome para renomear, e arraste pela alça à
            esquerda para reordenar como aparecem no cronômetro.
          </p>
        </div>
        <ActionTypeForm onCreate={createActionType} />
      </div>
      <Card>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              {actionTypes.length === 0 && (
                <div className="mb-4 flex flex-col items-start gap-2 rounded-md border border-dashed p-4">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma categoria encontrada. Se você espera que as categorias
                    padrão tivessem sido criadas automaticamente, pode restaurá-las
                    aqui.
                  </p>
                  <Button size="sm" variant="outline" onClick={handleRestore} disabled={restoring}>
                    {restoring ? "Restaurando..." : "Restaurar categorias padrão"}
                  </Button>
                </div>
              )}
              <ActionTypeTable
                actionTypes={actionTypes}
                onRename={renameActionType}
                onIconChange={setActionTypeIcon}
                onColorChange={setActionTypeColor}
                onArchiveToggle={setArchived}
                onReorder={reorderActionTypes}
                onDelete={deleteActionType}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
