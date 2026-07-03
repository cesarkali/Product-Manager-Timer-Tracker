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
}: {
  actionTypes: ActionType[];
  onCreate: (data: ManualEntryData) => Promise<void>;
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
      notes: "",
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
        notes: data.notes || null,
      });
      reset({
        date: data.date,
        taskCreated: false,
        actionTypeId: "",
        startTime: "",
        endTime: "",
        tasks: [],
      });
      toast.success("Registro adicionado.");
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
