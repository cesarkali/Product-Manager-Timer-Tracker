"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntryFormFields } from "@/components/entries/entry-form-fields";
import { manualEntrySchema, type ManualEntryInput } from "@/lib/validation";
import type { ActionType, TimeEntry } from "@/lib/types";
import type { ManualEntryData } from "@/hooks/use-time-entries";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function EditEntryDialog({
  entry,
  actionTypes,
  onOpenChange,
  onSave,
}: {
  entry: TimeEntry | null;
  actionTypes: ActionType[];
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: ManualEntryData) => Promise<void>;
}) {
  const startDate = entry?.startTime.toDate();
  const endDate = entry?.endTime.toDate();

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ManualEntryInput>({
    resolver: zodResolver(manualEntrySchema),
    values: entry
      ? {
          actionTypeId: entry.actionTypeId,
          date: toIsoDate(startDate!),
          startTime: toTimeString(startDate!),
          endTime: toTimeString(endDate!),
          taskCreated: entry.taskCreated,
          tasks: entry.tasks ?? [],
          notes: entry.notes ?? "",
        }
      : undefined,
  });

  async function onSubmit(data: ManualEntryInput) {
    if (!entry) return;
    const actionType = actionTypes.find((a) => a.id === data.actionTypeId);
    if (!actionType) return;
    try {
      await onSave(entry.id, {
        actionTypeId: actionType.id,
        actionTypeName: actionType.name,
        startTime: new Date(`${data.date}T${data.startTime}`),
        endTime: new Date(`${data.date}T${data.endTime}`),
        taskCreated: data.taskCreated,
        tasks: data.tasks,
        notes: data.notes || null,
      });
      toast.success("Registro atualizado.");
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar as alterações.");
    }
  }

  return (
    <Dialog open={entry != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar registro</DialogTitle>
        </DialogHeader>
        {entry && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <EntryFormFields
              actionTypes={actionTypes}
              frozenActionTypeName={entry.actionTypeName}
              control={control}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
