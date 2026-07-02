"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionTypes } from "@/hooks/use-action-types";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { customRange, rangeForPreset, type DateRange, type RangePreset } from "@/lib/time/ranges";
import { formatDayLabel } from "@/lib/time/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { CategoryTotalsChart, type CategoryTotal } from "@/components/dashboard/category-totals-chart";
import { DailyTotalsChart, type DailyTotal } from "@/components/dashboard/daily-totals-chart";
import {
  CategoryFrequencyTable,
  type CategoryDayFrequency,
} from "@/components/dashboard/category-frequency-table";
import { EntriesTable } from "@/components/entries/entries-table";

function isRangePreset(value: string | null): value is RangePreset {
  return value === "today" || value === "7d" || value === "30d" || value === "custom";
}

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preset: RangePreset = isRangePreset(searchParams.get("range"))
    ? (searchParams.get("range") as RangePreset)
    : "7d";

  const customStart = parseDateParam(searchParams.get("start"));
  const customEnd = parseDateParam(searchParams.get("end"));
  const activeCustomRange: DateRange | null =
    customStart && customEnd ? customRange(customStart, customEnd) : null;
  const customStartMs = activeCustomRange?.start.getTime();
  const customEndMs = activeCustomRange?.end.getTime();

  const range = useMemo(() => {
    if (preset === "custom") return activeCustomRange ?? rangeForPreset("7d");
    return rangeForPreset(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customStartMs, customEndMs]);

  const { actionTypesById } = useActionTypes();
  const { entries, deleteEntry, updateEntry } = useTimeEntries(range);

  function setPreset(next: Exclude<RangePreset, "custom">) {
    const params = new URLSearchParams(searchParams);
    params.set("range", next);
    params.delete("start");
    params.delete("end");
    router.replace(`/dashboard?${params.toString()}`);
  }

  function setCustomRange(span: DateRange) {
    const params = new URLSearchParams(searchParams);
    params.set("range", "custom");
    params.set("start", span.start.toISOString().slice(0, 10));
    params.set("end", span.end.toISOString().slice(0, 10));
    router.replace(`/dashboard?${params.toString()}`);
  }

  const totalSeconds = entries.reduce((sum, e) => sum + e.durationSeconds, 0);
  const taskCreatedPercent =
    entries.length === 0 ? 0 : Math.round((entries.filter((e) => e.taskCreated).length / entries.length) * 100);

  const categoryTotals: CategoryTotal[] = useMemo(() => {
    const totals = new Map<string, CategoryTotal>();
    for (const entry of entries) {
      const actionType = actionTypesById.get(entry.actionTypeId);
      const existing = totals.get(entry.actionTypeId);
      if (existing) {
        existing.totalSeconds += entry.durationSeconds;
        existing.count += 1;
      } else {
        totals.set(entry.actionTypeId, {
          actionTypeId: entry.actionTypeId,
          name: actionType?.name ?? `${entry.actionTypeName} (excluída)`,
          colorTag: actionType?.colorTag,
          totalSeconds: entry.durationSeconds,
          count: 1,
        });
      }
    }
    return Array.from(totals.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [entries, actionTypesById]);

  const categoryDayFrequency: CategoryDayFrequency[] = useMemo(() => {
    const totals = new Map<string, CategoryDayFrequency>();
    for (const entry of entries) {
      const actionType = actionTypesById.get(entry.actionTypeId);
      const startDate = entry.startTime.toDate();
      const dayKey = startDate.toISOString().slice(0, 10);
      const key = `${dayKey}__${entry.actionTypeId}`;
      const existing = totals.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        totals.set(key, {
          dayKey,
          dayLabel: formatDayLabel(startDate),
          actionTypeId: entry.actionTypeId,
          name: actionType?.name ?? `${entry.actionTypeName} (excluída)`,
          colorTag: actionType?.colorTag,
          icon: actionType?.icon,
          count: 1,
        });
      }
    }
    return Array.from(totals.values()).sort((a, b) => {
      if (a.dayKey !== b.dayKey) return b.dayKey.localeCompare(a.dayKey);
      return b.count - a.count;
    });
  }, [entries, actionTypesById]);

  const dailyTotals: DailyTotal[] = useMemo(() => {
    const totals = new Map<string, number>();
    for (const entry of entries) {
      const key = formatDayLabel(entry.startTime.toDate());
      totals.set(key, (totals.get(key) ?? 0) + entry.durationSeconds);
    }
    return Array.from(totals.entries())
      .map(([dayLabel, totalSeconds]) => ({ dayLabel, totalSeconds }))
      .reverse();
  }, [entries]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Evidência de onde o seu tempo foi gasto no período selecionado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter
            preset={preset}
            customRange={activeCustomRange}
            onChange={setPreset}
            onCustomRangeChange={setCustomRange}
          />
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            Exportar / imprimir
          </Button>
        </div>
      </div>

      <StatTiles
        totalSeconds={totalSeconds}
        entryCount={entries.length}
        taskCreatedPercent={taskCreatedPercent}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryTotalsChart data={categoryTotals} />
        <DailyTotalsChart data={dailyTotals} />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Frequência por dia</h2>
          <p className="text-sm text-muted-foreground">
            Quantas vezes cada categoria foi acionada no mesmo dia — útil pra ver rotinas
            que se repetem várias vezes num dia só.
          </p>
        </div>
        <Card>
          <CardContent>
            <CategoryFrequencyTable data={categoryDayFrequency} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 print:hidden">
        <h2 className="text-lg font-semibold">Registros do período</h2>
        <Card>
          <CardContent>
            <EntriesTable
              entries={entries}
              actionTypesById={actionTypesById}
              onDelete={deleteEntry}
              onToggleTaskCreated={(id, value) => updateEntry(id, { taskCreated: value })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
