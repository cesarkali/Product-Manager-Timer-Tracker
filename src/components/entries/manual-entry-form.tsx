"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { manualEntrySchema, type ManualEntryInput } from "@/lib/validation";
import type { ActionType } from "@/lib/types";
import type { ManualEntryData } from "@/hooks/use-time-entries";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ManualEntryForm({
  actionTypes,
  onCreate,
}: {
  actionTypes: ActionType[];
  onCreate: (data: ManualEntryData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ManualEntryInput>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: { date: todayIso(), taskCreated: false },
  });

  const taskCreated = watch("taskCreated");

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
        movideskLink: data.movideskLink || null,
        jiraLink: data.jiraLink || null,
        notes: data.notes || null,
      });
      reset({ date: data.date, taskCreated: false, actionTypeId: "", startTime: "", endTime: "" });
      toast.success("Registro adicionado.");
    } catch {
      toast.error("Não foi possível salvar o registro.");
    }
  }

  return (
    <form
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-1">
        <Label>Categoria</Label>
        <Select onValueChange={(value) => setValue("actionTypeId", value as string)}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha" />
          </SelectTrigger>
          <SelectContent>
            {actionTypes.map((actionType) => (
              <SelectItem key={actionType.id} value={actionType.id}>
                {actionType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.actionTypeId && (
          <p className="text-sm text-destructive">{errors.actionTypeId.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="date">Data</Label>
        <Input id="date" type="date" {...register("date")} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="startTime">Início</Label>
        <Input id="startTime" type="time" step="1" {...register("startTime")} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="endTime">Término</Label>
        <Input id="endTime" type="time" step="1" {...register("endTime")} />
        {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <Label htmlFor="movideskLink">Link do Movidesk (opcional)</Label>
        <Input id="movideskLink" placeholder="https://..." {...register("movideskLink")} />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <Label htmlFor="jiraLink">Link do Jira (opcional)</Label>
        <Input id="jiraLink" placeholder="https://..." {...register("jiraLink")} />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="notes">Comentários (opcional)</Label>
        <Input id="notes" placeholder="Texto livre" {...register("notes")} />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={taskCreated}
          onChange={(e) => setValue("taskCreated", e.target.checked)}
        />
        Task foi criada para essa situação
      </label>
      <div className="sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={isSubmitting}>
          Adicionar registro
        </Button>
      </div>
    </form>
  );
}
