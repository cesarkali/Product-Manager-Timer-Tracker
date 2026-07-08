"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EntryFormFields } from "@/components/entries/entry-form-fields";
import { manualEntrySchema, type ManualEntryInput } from "@/lib/validation";
import { toLocalIsoDate } from "@/lib/time/format";
import type { ActionType } from "@/lib/types";
import type { ManualEntryData } from "@/hooks/use-time-entries";

function todayIso() {
  return toLocalIsoDate(new Date());
}

export function ManualEntryForm({
  actionTypes,
  onCreate,
  defaultValues,
  onSuccess,
}: {
  actionTypes: ActionType[];
  onCreate: (data: ManualEntryData) => Promise<void>;
  /** Pré-preenchimento (ex.: lacuna clicada na timeline do dia). */
  defaultValues?: Partial<ManualEntryInput>;
  onSuccess?: () => void;
}) {
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ManualEntryInput>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      date: todayIso(),
      taskCreated: false,
      tasks: [],
      actionTypeId: "",
      startTime: "",
      endTime: "",
      description: "",
      notes: "",
      pausedSeconds: 0,
      ...defaultValues,
    },
  });

  async function onSubmit(data: ManualEntryInput) {
    const actionType = actionTypes.find((a) => a.id === data.actionTypeId);
    if (!actionType) return;
    try {
      await onCreate({
        actionTypeId: actionType.id,
        actionTypeName: actionType.name,
        startTime: new Date(`${data.date}T${data.startTime}`),
        endTime: new Date(`${data.date}T${data.endTime}`),
        taskCreated: data.taskCreated,
        tasks: data.tasks,
        description: data.description || null,
        notes: data.notes || null,
        pausedSeconds: data.pausedSeconds ?? 0,
      });
      reset({
        date: data.date,
        taskCreated: false,
        actionTypeId: "",
        startTime: "",
        endTime: "",
        description: "",
        notes: "",
        tasks: [],
        pausedSeconds: 0,
      });
      toast.success("Registro adicionado.");
      onSuccess?.();
    } catch {
      toast.error("Não foi possível salvar o registro.");
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <EntryFormFields
        actionTypes={actionTypes}
        control={control}
        watch={watch}
        setValue={setValue}
        errors={errors}
      />
      <div>
        <Button type="submit" disabled={isSubmitting}>
          Adicionar registro
        </Button>
      </div>
    </form>
  );
}
