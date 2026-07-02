"use client";

import { useActionTypes } from "@/hooks/use-action-types";
import { ActionTypeForm } from "@/components/action-types/action-type-form";
import { ActionTypeTable } from "@/components/action-types/action-type-table";
import { Card, CardContent } from "@/components/ui/card";

export default function ActionTypesPage() {
  const {
    actionTypes,
    loading,
    createActionType,
    renameActionType,
    setActionTypeIcon,
    setArchived,
    deleteActionType,
  } = useActionTypes();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            As atividades recorrentes que você cronometra. Clique no ícone para trocar,
            ou no nome para renomear.
          </p>
        </div>
        <ActionTypeForm onCreate={createActionType} />
      </div>
      <Card>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <ActionTypeTable
              actionTypes={actionTypes}
              onRename={renameActionType}
              onIconChange={setActionTypeIcon}
              onArchiveToggle={setArchived}
              onDelete={deleteActionType}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
