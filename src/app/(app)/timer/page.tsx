"use client";

import { useActionTypes } from "@/hooks/use-action-types";
import { useActiveTimer } from "@/hooks/use-active-timer";
import { TimerCard } from "@/components/timer/timer-card";
import { ActionTypeGrid } from "@/components/timer/action-type-grid";

export default function TimerPage() {
  const { activeActionTypes, actionTypesById, loading: loadingTypes } = useActionTypes();
  const { activeTimer, startTimer, stopTimer, updateActiveTimerFields } = useActiveTimer();

  const activeActionType = activeTimer ? actionTypesById.get(activeTimer.actionTypeId) ?? null : null;

  return (
    <div className="flex flex-col gap-10">
      <TimerCard
        actionType={activeActionType}
        startTimeMs={activeTimer?.startTime ? activeTimer.startTime.toMillis() : null}
        fields={{
          tasks: activeTimer?.tasks ?? [],
          comments: activeTimer?.comments ?? null,
        }}
        onStop={() => activeActionType && stopTimer(activeActionType.name)}
        onFieldsChange={updateActiveTimerFields}
      />
      <div className="flex flex-col gap-4">
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
    </div>
  );
}
