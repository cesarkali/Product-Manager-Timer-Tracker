"use client";

import { useMemo, useState } from "react";
import { useActionTypes } from "@/hooks/use-action-types";
import { useActiveTimer } from "@/hooks/use-active-timer";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { PageHeader } from "@/components/app-shell/page-header";
import { TimerCard } from "@/components/timer/timer-card";
import { ActionTypeGrid } from "@/components/timer/action-type-grid";
import { DaySummary } from "@/components/timer/day-summary";
import { DayTimeline } from "@/components/timer/day-timeline";
import { ManualEntryDialog } from "@/components/entries/manual-entry-dialog";
import { recentDescriptions } from "@/lib/description-suggestions";
import { rangeForPreset } from "@/lib/time/ranges";
import { toLocalIsoDate } from "@/lib/time/format";
import type { ManualEntryInput } from "@/lib/validation";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function TimerPage() {
  const { activeActionTypes, actionTypesById, loading: loadingTypes } = useActionTypes();
  const {
    activeTimer,
    elapsedSeconds,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    updateActiveTimerFields,
    adjustStartTime,
  } = useActiveTimer();
  const { prefs } = useUserPreferences();

  // Uma única assinatura de 7 dias alimenta a timeline (filtrando hoje) e as
  // sugestões de descrição (histórico da semana por categoria). Congelado no
  // mount — atravessar a meia-noite pede um F5, aceitável.
  const weekRange = useMemo(() => rangeForPreset("7d"), []);
  const { entries: weekEntries, addManualEntry } = useTimeEntries(weekRange);
  const todayIso = toLocalIsoDate(new Date());
  const todayEntries = useMemo(
    () => weekEntries.filter((entry) => toLocalIsoDate(entry.startTime.toDate()) === todayIso),
    [weekEntries, todayIso]
  );

  const activeActionType = activeTimer
    ? actionTypesById.get(activeTimer.actionTypeId) ?? null
    : null;
  const descriptionSuggestions = useMemo(
    () => (activeTimer ? recentDescriptions(weekEntries, activeTimer.actionTypeId) : []),
    [weekEntries, activeTimer]
  );

  const [gapValues, setGapValues] = useState<Partial<ManualEntryInput> | null>(null);

  const todayLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Hoje"
        description={<span className="inline-block first-letter:uppercase">{todayLabel}</span>}
        actions={
          <DaySummary entries={todayEntries} activeElapsedSeconds={activeTimer ? elapsedSeconds : 0} />
        }
      />

      <div data-tour="timer-card">
      <TimerCard
        actionType={activeActionType}
        startTimeMs={activeTimer?.startTime ? activeTimer.startTime.toMillis() : null}
        pausedAtMs={activeTimer?.pausedAt ? activeTimer.pausedAt.toMillis() : null}
        accumulatedPausedSeconds={activeTimer?.accumulatedPausedSeconds ?? 0}
        fields={{
          tasks: activeTimer?.tasks ?? [],
          comments: activeTimer?.comments ?? null,
          description: activeTimer?.description ?? null,
        }}
        descriptionSuggestions={descriptionSuggestions}
        onStop={() => activeActionType && stopTimer(activeActionType.name)}
        onPause={pauseTimer}
        onResume={resumeTimer}
        onFieldsChange={updateActiveTimerFields}
        onAdjustStartTime={adjustStartTime}
      />
      </div>

      <div data-tour="day-timeline" className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Linha do dia</h2>
        <DayTimeline
          entries={todayEntries}
          actionTypesById={actionTypesById}
          activeTimer={
            activeTimer?.startTime
              ? { actionTypeId: activeTimer.actionTypeId, startMs: activeTimer.startTime.toMillis() }
              : null
          }
          workStart={prefs.workStart}
          workEnd={prefs.workEnd}
          onGapClick={(gap) =>
            setGapValues({
              date: toLocalIsoDate(gap.start),
              startTime: toTimeString(gap.start),
              endTime: toTimeString(gap.end),
            })
          }
        />
      </div>

      <div data-tour="categories" className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Categorias</h2>
          <p className="text-sm text-muted-foreground">
            Escolha uma para começar a cronometrar (ou pressione as teclas 1-9). Trocar de
            categoria com o cronômetro rodando salva automaticamente o registro anterior.
          </p>
        </div>
        {loadingTypes ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <ActionTypeGrid
            actionTypes={activeActionTypes}
            activeActionTypeId={activeTimer?.actionTypeId}
            onSelect={(actionType) => startTimer(actionType, activeActionType)}
          />
        )}
      </div>

      <ManualEntryDialog
        open={gapValues != null}
        onOpenChange={(open) => !open && setGapValues(null)}
        actionTypes={activeActionTypes}
        initialValues={gapValues ?? undefined}
        onCreate={addManualEntry}
      />
    </div>
  );
}
