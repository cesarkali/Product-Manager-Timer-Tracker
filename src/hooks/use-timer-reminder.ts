"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { useActiveTimer } from "@/hooks/use-active-timer";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import type { TimeEntry } from "@/lib/types";

const CHECK_INTERVAL_MS = 60_000;
const LAST_NOTIFIED_KEY = "pmtt:reminder:lastNotifiedMs";

function parseHourMinuteToday(value: string, now: Date): number {
  const [h, m] = value.split(":").map(Number);
  const d = new Date(now);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d.getTime();
}

/** Dispara o aviso de cronômetro parado: toast no app + notificação do
 * navegador. Compartilhada entre o lembrete real (que só notifica o sistema
 * com a aba em segundo plano) e o botão "Testar aviso" das preferências
 * (`forceNotification: true` — mostra a notificação mesmo com a aba visível). */
export function fireTimerReminder({
  idleMinutes,
  onGoToToday,
  forceNotification = false,
}: {
  idleMinutes: number;
  onGoToToday: () => void;
  forceNotification?: boolean;
}) {
  toast.warning(`Sem cronômetro há ${idleMinutes} min`, {
    description: "O que você está fazendo agora? Registre para não perder a evidência.",
    duration: 15_000,
    action: { label: "Ir para Hoje", onClick: onGoToToday },
  });

  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "granted" &&
    (forceNotification || document.visibilityState === "hidden")
  ) {
    const notification = new Notification("PMTT — cronômetro parado", {
      body: `Sem registro há ${idleMinutes} min. Clique para voltar e cronometrar.`,
      icon: "/icon.svg",
      tag: "pmtt-timer-reminder",
    });
    notification.onclick = () => {
      window.focus();
      onGoToToday();
      notification.close();
    };
  }
}

/** Lembrete "cadê o cronômetro?": dentro do expediente configurado, se nenhum
 * timer estiver rodando há mais que `reminderMinutes`, dispara um toast (com
 * ação para ir à tela Hoje) e — se a permissão foi concedida e a aba está em
 * segundo plano — uma notificação do navegador. Limite conhecido: com a aba
 * fechada nada é enviado (sem service worker/push por ora). */
export function useTimerReminder() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeTimer, loading } = useActiveTimer();
  const { prefs } = useUserPreferences();

  // Desde quando não há timer rodando. null = ainda não sabemos.
  const idleSinceMsRef = useRef<number | null>(null);
  const hadTimerRef = useRef(false);

  // Timer pausado conta como "rodando" (a pessoa sabe que está no meio de algo).
  const hasTimer = activeTimer != null;

  // Transições do timer: rodando -> parado marca o início da ociosidade agora.
  useEffect(() => {
    if (loading) return;
    if (hasTimer) {
      hadTimerRef.current = true;
      idleSinceMsRef.current = null;
      return;
    }
    if (hadTimerRef.current) {
      idleSinceMsRef.current = Date.now();
      hadTimerRef.current = false;
    }
  }, [hasTimer, loading]);

  // No mount sem timer: usa o fim do último registro como início da ociosidade
  // (uma única leitura, query de campo único — sem índice composto).
  useEffect(() => {
    if (!user || loading || hasTimer || idleSinceMsRef.current != null) return;
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "users", user.uid, "timeEntries"),
            orderBy("startTime", "desc"),
            limit(1)
          )
        );
        if (cancelled || idleSinceMsRef.current != null) return;
        const last = snapshot.docs[0]?.data() as TimeEntry | undefined;
        idleSinceMsRef.current = last?.endTime
          ? Math.min(last.endTime.toMillis(), Date.now())
          : Date.now();
      } catch {
        if (!cancelled) idleSinceMsRef.current = Date.now();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, hasTimer]);

  useEffect(() => {
    if (!user || !prefs.reminderEnabled) return;

    function check() {
      if (hasTimer || idleSinceMsRef.current == null) return;

      const now = new Date();
      if (!prefs.workDays.includes(now.getDay())) return;
      const nowMs = now.getTime();
      const workStartMs = parseHourMinuteToday(prefs.workStart, now);
      const workEndMs = parseHourMinuteToday(prefs.workEnd, now);
      if (nowMs < workStartMs || nowMs > workEndMs) return;

      const reminderMs = prefs.reminderMinutes * 60_000;
      const idleMs = nowMs - idleSinceMsRef.current;
      if (idleMs < reminderMs) return;

      // Throttle entre avisos (sobrevive a reload via sessionStorage).
      const lastNotifiedMs = Number(sessionStorage.getItem(LAST_NOTIFIED_KEY) ?? 0);
      if (nowMs - lastNotifiedMs < reminderMs) return;
      sessionStorage.setItem(LAST_NOTIFIED_KEY, String(nowMs));

      const idleMinutes = Math.floor(idleMs / 60_000);
      fireTimerReminder({ idleMinutes, onGoToToday: () => router.push("/timer") });
    }

    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, hasTimer, prefs, router]);
}
