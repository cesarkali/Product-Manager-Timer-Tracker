"use client";

import { useTimerReminder } from "@/hooks/use-timer-reminder";

/** Componente sem render: mantém o lembrete de cronômetro vivo em qualquer
 * rota enquanto o app estiver aberto (montado no layout autenticado). */
export function TimerReminder() {
  useTimerReminder();
  return null;
}
