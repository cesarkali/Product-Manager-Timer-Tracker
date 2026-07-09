"use client";

import { useFieldArray, type Control, type FieldErrors, type UseFormWatch, type UseFormSetValue } from "react-hook-form";
import { CalendarIcon, PauseCircle, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomDayPicker } from "@/components/shared/custom-day-picker";
import { TimeOfDayPicker, type TimeOfDay } from "@/components/shared/time-of-day-picker";
import { LinkedTasksEditor } from "@/components/shared/linked-tasks-editor";
import { formatDayLabel } from "@/lib/time/format";
import { DESCRIPTION_MAX_LENGTH, type ActionType } from "@/lib/types";
import type { ManualEntryInput } from "@/lib/validation";

const NOTES_MAX_LENGTH = 1000;

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseTimeOfDay(value: string): TimeOfDay | null {
  if (!value) return null;
  const [h, m, s] = value.split(":").map(Number);
  if (h == null || m == null) return null;
  return { hours: h, minutes: m, seconds: s ?? 0 };
}

function toTimeString(time: TimeOfDay): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(time.hours)}:${pad(time.minutes)}:${pad(time.seconds)}`;
}

export function EntryFormFields({
  actionTypes,
  frozenActionTypeName,
  control,
  watch,
  setValue,
  errors,
  showPausedTime = false,
}: {
  actionTypes: ActionType[];
  /** Nome congelado da categoria do registro, usado quando o actionTypeId atual
   * não existe mais na lista (categoria excluída) — evita mostrar o ID cru. */
  frozenActionTypeName?: string;
  control: Control<ManualEntryInput>;
  watch: UseFormWatch<ManualEntryInput>;
  setValue: UseFormSetValue<ManualEntryInput>;
  errors: FieldErrors<ManualEntryInput>;
  /** Mostra o campo "Tempo pausado" — só faz sentido ao editar um registro
   * que já existe (lançamento manual nunca teve cronômetro/pausa). */
  showPausedTime?: boolean;
}) {
  const { fields: taskFields, append, remove, update } = useFieldArray({ control, name: "tasks" });

  const actionTypeId = watch("actionTypeId");
  const actionTypeExists = actionTypes.some((a) => a.id === actionTypeId);
  const date = watch("date");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const taskCreated = watch("taskCreated");

  const selectedDate = parseIsoDate(date);
  const selectedStart = parseTimeOfDay(startTime);
  const selectedEnd = parseTimeOfDay(endTime);

  const pausedSeconds = watch("pausedSeconds") ?? 0;
  const pausedMinutesPart = Math.floor(pausedSeconds / 60);
  const pausedSecondsPart = pausedSeconds % 60;

  function setPausedMinutes(minutes: number) {
    setValue("pausedSeconds", Math.max(0, minutes) * 60 + pausedSecondsPart, { shouldValidate: true });
  }
  function setPausedSecondsPart(seconds: number) {
    setValue("pausedSeconds", pausedMinutesPart * 60 + Math.max(0, Math.min(59, seconds)), {
      shouldValidate: true,
    });
  }

  return (
    <div className="@container flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @lg:grid-cols-12">
        <div className="flex flex-col gap-1.5 @lg:col-span-4">
          <Label>Categoria</Label>
          <Select value={actionTypeId ?? ""} onValueChange={(value) => setValue("actionTypeId", value as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha">
                {(value: string | null) => {
                  if (!value) return "Escolha";
                  const match = actionTypes.find((a) => a.id === value);
                  if (match) return match.name;
                  return `${frozenActionTypeName ?? value} (excluída)`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {!actionTypeExists && actionTypeId && (
                <SelectItem value={actionTypeId} disabled>
                  {frozenActionTypeName ?? actionTypeId} (excluída)
                </SelectItem>
              )}
              {actionTypes.map((actionType) => (
                <SelectItem key={actionType.id} value={actionType.id}>
                  {actionType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!actionTypeExists && actionTypeId && (
            <p className="text-xs text-muted-foreground">
              Esta categoria foi excluída — escolha outra para salvar alterações.
            </p>
          )}
          {errors.actionTypeId && (
            <p className="text-sm text-destructive">{errors.actionTypeId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 @lg:col-span-3">
          <Label>Data</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button type="button" variant="outline" className="w-full justify-start gap-2 font-normal">
                  <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {selectedDate ? formatDayLabel(selectedDate) : "Escolher data"}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0">
              <CustomDayPicker
                value={selectedDate}
                onChange={(day) => setValue("date", toIsoDate(day))}
                maxDate={new Date()}
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5 @lg:col-span-2">
          <Label>Início</Label>
          <TimeOfDayPicker
            value={selectedStart}
            onChange={(time) => setValue("startTime", toTimeString(time))}
            placeholder="Escolher início"
          />
        </div>

        <div className="flex flex-col gap-1.5 @lg:col-span-3">
          <Label>Término</Label>
          <TimeOfDayPicker
            value={selectedEnd}
            onChange={(time) => setValue("endTime", toTimeString(time))}
            placeholder="Escolher término"
          />
          {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
        </div>
      </div>

      {showPausedTime && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 @sm:flex-row @sm:items-center @sm:justify-between">
          <div className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                Tempo pausado <span className="font-normal text-muted-foreground">(opcional)</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Descontado do intervalo entre início e término.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start @sm:self-auto">
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                value={pausedMinutesPart}
                onChange={(e) => setPausedMinutes(Number(e.target.value) || 0)}
                className="w-14 text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Minutos pausados"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
            <span className="font-mono text-muted-foreground">:</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={59}
                value={pausedSecondsPart}
                onChange={(e) => setPausedSecondsPart(Number(e.target.value) || 0)}
                className="w-14 text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Segundos pausados"
              />
              <span className="text-xs text-muted-foreground">seg</span>
            </div>
            {pausedSeconds > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setValue("pausedSeconds", 0, { shouldValidate: true })}
                aria-label="Zerar tempo pausado"
                className="text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {errors.pausedSeconds && (
            <p className="w-full text-sm text-destructive">{errors.pausedSeconds.message}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input
          id="description"
          placeholder="O que você estava fazendo?"
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={watch("description") ?? ""}
          onChange={(e) => setValue("description", e.target.value)}
        />
        <p className="text-right text-xs text-muted-foreground">
          {(watch("description") ?? "").length}/{DESCRIPTION_MAX_LENGTH}
        </p>
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tasks vinculadas (opcional)</Label>
        <LinkedTasksEditor
          items={taskFields}
          onAdd={() => append({ type: "jira", reference: "", storyPoints: 0 })}
          onRemove={remove}
          onChangeItem={(index, patch) => update(index, { ...taskFields[index], ...patch })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Comentários (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Texto livre"
          rows={4}
          maxLength={NOTES_MAX_LENGTH}
          value={watch("notes") ?? ""}
          onChange={(e) => setValue("notes", e.target.value)}
        />
        <p className="text-right text-xs text-muted-foreground">
          {(watch("notes") ?? "").length}/{NOTES_MAX_LENGTH}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={taskCreated}
          onChange={(e) => setValue("taskCreated", e.target.checked)}
        />
        Task foi criada para essa situação
      </label>
    </div>
  );
}
