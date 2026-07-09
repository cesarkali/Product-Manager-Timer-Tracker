"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeOfDayPicker, type TimeOfDay } from "@/components/shared/time-of-day-picker";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { cn } from "@/lib/utils";

const REMINDER_MINUTE_OPTIONS = [10, 15, 20, 30, 45, 60];

/** dom..sáb, na ordem do getDay(). */
const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_NAMES = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

function parseHourMinute(value: string): TimeOfDay {
  const [h, m] = value.split(":").map(Number);
  return { hours: Number.isFinite(h) ? h : 0, minutes: Number.isFinite(m) ? m : 0, seconds: 0 };
}

function toHourMinute(time: TimeOfDay): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(time.hours)}:${pad(time.minutes)}`;
}

export function PreferencesPanel() {
  const { prefs, loading, updatePreferences } = useUserPreferences();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(
    () => (typeof Notification !== "undefined" ? Notification.permission : null)
  );

  async function handleToggleReminder(enabled: boolean) {
    if (enabled && typeof Notification !== "undefined" && Notification.permission === "default") {
      // Pede a permissão só no momento em que o lembrete é ativado.
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
    await updatePreferences({ reminderEnabled: enabled });
    toast.success(enabled ? "Lembrete ativado." : "Lembrete desativado.");
  }

  function toggleWorkDay(day: number) {
    const next = prefs.workDays.includes(day)
      ? prefs.workDays.filter((d) => d !== day)
      : [...prefs.workDays, day].sort((a, b) => a - b);
    if (next.length === 0) {
      toast.error("Mantenha ao menos um dia útil.");
      return;
    }
    void updatePreferences({ workDays: next });
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4 text-muted-foreground" />
          Lembrete de cronômetro
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="reminder-enabled">
              Avisar quando não houver cronômetro rodando
            </Label>
            <p className="text-xs text-muted-foreground">
              Dentro do seu expediente, se nenhum cronômetro estiver rodando pelo tempo
              configurado, você recebe um aviso no app e uma notificação do navegador.
            </p>
          </div>
          <Switch
            id="reminder-enabled"
            checked={prefs.reminderEnabled}
            onCheckedChange={(checked) => void handleToggleReminder(Boolean(checked))}
          />
        </div>

        {prefs.reminderEnabled && notificationPermission === "denied" && (
          <p className="rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
            A permissão de notificação foi negada no navegador — os avisos aparecerão só
            dentro do app. Para reativar, ajuste as permissões do site no navegador.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Avisar após</Label>
            <Select
              value={String(prefs.reminderMinutes)}
              onValueChange={(value) =>
                void updatePreferences({ reminderMinutes: Number(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>{(value: string | null) => `${value ?? 15} min parado`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {REMINDER_MINUTE_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Início do expediente</Label>
            <TimeOfDayPicker
              value={parseHourMinute(prefs.workStart)}
              onChange={(time) => void updatePreferences({ workStart: toHourMinute(time) })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Fim do expediente</Label>
            <TimeOfDayPicker
              value={parseHourMinute(prefs.workEnd)}
              onChange={(time) => void updatePreferences({ workEnd: toHourMinute(time) })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Dias úteis</Label>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label, day) => {
              const active = prefs.workDays.includes(day);
              return (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => toggleWorkDay(day)}
                  aria-pressed={active}
                  aria-label={WEEKDAY_NAMES[day]}
                  title={WEEKDAY_NAMES[day]}
                  className={cn("h-9 w-9 p-0 font-semibold", !active && "text-muted-foreground")}
                >
                  {label}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            O expediente também define a faixa da linha do dia na tela Hoje.
          </p>
        </div>

        <p className="border-t pt-4 text-xs text-muted-foreground">
          Limite do navegador: a notificação funciona com a aba do PMTT aberta (mesmo em
          segundo plano) — com a aba fechada, nenhum aviso é enviado.
        </p>
      </CardContent>
    </Card>
  );
}
