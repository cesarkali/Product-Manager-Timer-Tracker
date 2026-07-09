"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActionTypes } from "@/hooks/use-action-types";
import { useBusinessAreas } from "@/hooks/use-business-areas";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { EditEntryDialog } from "@/components/entries/edit-entry-dialog";
import type { TimeEntry } from "@/lib/types";
import {
  customRange,
  previousRange,
  rangeForPreset,
  type DateRange,
  type RangePreset,
} from "@/lib/time/ranges";
import { formatDayLabel, formatDateTimeLabel, toLocalIsoDate } from "@/lib/time/format";
import { areaColor, NO_AREA_LABEL } from "@/lib/areas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app-shell/page-header";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { StatTiles, type StatTilesPrevious } from "@/components/dashboard/stat-tiles";
import { CategoryTotalsChart, type CategoryTotal } from "@/components/dashboard/category-totals-chart";
import { CategoryPointsChart, type CategoryPoints } from "@/components/dashboard/category-points-chart";
import {
  DailyCompositionChart,
  type DailyCompositionRow,
} from "@/components/dashboard/daily-composition-chart";
import { AreaTotalsChart, type AreaTotal } from "@/components/dashboard/area-totals-chart";
import { TaskTimeTable, type TaskAggregate } from "@/components/dashboard/task-time-table";
import { WeekHourHeatmap } from "@/components/dashboard/week-hour-heatmap";
import { WorkRhythmCard } from "@/components/dashboard/work-rhythm-card";
import { ExecutiveSummary } from "@/components/dashboard/executive-summary";
import {
  CategoryFrequencyTable,
  type CategoryDayFrequency,
} from "@/components/dashboard/category-frequency-table";
import { EntriesTable } from "@/components/entries/entries-table";

/** Seção de lista minimizável do dashboard (Tempo por task, Frequência,
 * Registros) — em períodos longos essas tabelas ficam enormes. O conteúdo
 * colapsado fica só oculto via CSS (não desmontado): quando a seção participa
 * da impressão (`printVisible`), ela sai no PDF mesmo minimizada na tela. */
function CollapsibleSection({
  title,
  description,
  count,
  printVisible = false,
  children,
}: {
  title: string;
  description?: string;
  /** Nº de itens da lista, visível também com a seção minimizada. */
  count: number;
  /** Se a seção entra na impressão (sempre expandida no papel). */
  printVisible?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={cn("flex flex-col gap-3 break-inside-avoid", !printVisible && "print:hidden")}>
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-semibold">
            {title}{" "}
            <span className="text-sm font-normal text-muted-foreground">({count})</span>
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setCollapsed((current) => !current)}
          className="shrink-0 gap-1 text-muted-foreground"
          aria-expanded={!collapsed}
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200", collapsed && "-rotate-90")}
          />
          {collapsed ? "Expandir" : "Minimizar"}
        </Button>
      </div>
      {printVisible && <h2 className="hidden text-base font-semibold print:block">{title}</h2>}
      <div className={cn(collapsed && "hidden", printVisible && "print:block")}>{children}</div>
    </div>
  );
}

// "30d" segue aceito na URL por back-compat com links salvos, mesmo sem botão.
function isRangePreset(value: string | null): value is RangePreset {
  return (
    value === "today" ||
    value === "7d" ||
    value === "30d" ||
    value === "month" ||
    value === "lastMonth" ||
    value === "custom"
  );
}

function kpisOf(entries: TimeEntry[]) {
  const totalSeconds = entries.reduce((sum, e) => sum + e.durationSeconds, 0);
  const taskCreatedPercent =
    entries.length === 0
      ? 0
      : Math.round((entries.filter((e) => e.taskCreated).length / entries.length) * 100);
  const totalStoryPoints = entries.reduce(
    (sum, e) => sum + (e.tasks ?? []).reduce((s, t) => s + t.storyPoints, 0),
    0
  );
  const secondsPerPoint =
    totalStoryPoints === 0 ? null : Math.round(totalSeconds / totalStoryPoints);
  return {
    totalSeconds,
    entryCount: entries.length,
    taskCreatedPercent,
    totalStoryPoints,
    secondsPerPoint,
  };
}

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
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

  const { actionTypes, actionTypesById } = useActionTypes();
  const { businessAreas } = useBusinessAreas();
  const colorForArea = useMemo(
    () => (area: string) => areaColor(area, businessAreas),
    [businessAreas]
  );
  const businessAreaOrder = useMemo(
    () => new Map(businessAreas.map((a) => [a.name, a.order ?? 0])),
    [businessAreas]
  );
  const { entries, deleteEntry, updateEntry, updateEntryFull } = useTimeEntries(range);
  // Segunda assinatura, do período imediatamente anterior — base dos deltas
  // dos KPIs. Mesmo volume da principal; custo desprezível no uso atual.
  const prevRange = useMemo(() => previousRange(range), [range]);
  const { entries: previousEntries } = useTimeEntries(prevRange);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

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
    params.set("start", toLocalIsoDate(span.start));
    params.set("end", toLocalIsoDate(span.end));
    router.replace(`/dashboard?${params.toString()}`);
  }

  const kpis = kpisOf(entries);
  const previousKpis: StatTilesPrevious | null =
    previousEntries.length === 0 ? null : kpisOf(previousEntries);

  const areaTotals: AreaTotal[] = useMemo(() => {
    const totals = new Map<string, number>();
    let totalSeconds = 0;
    for (const entry of entries) {
      const area = actionTypesById.get(entry.actionTypeId)?.area ?? NO_AREA_LABEL;
      totals.set(area, (totals.get(area) ?? 0) + entry.durationSeconds);
      totalSeconds += entry.durationSeconds;
    }
    return Array.from(totals.entries())
      .map(([area, seconds]) => ({
        area,
        totalSeconds: seconds,
        sharePercent: totalSeconds === 0 ? 0 : Math.round((seconds / totalSeconds) * 100),
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [entries, actionTypesById]);

  // "Sem área" não conta como área principal — é ausência de classificação.
  const topAreaEntry = areaTotals.find((a) => a.area !== NO_AREA_LABEL && a.totalSeconds > 0);
  const topArea = topAreaEntry
    ? { name: topAreaEntry.area, sharePercent: topAreaEntry.sharePercent }
    : null;

  const taskAggregates: TaskAggregate[] = useMemo(() => {
    const totals = new Map<string, TaskAggregate>();
    for (const entry of entries) {
      for (const task of entry.tasks ?? []) {
        const reference = task.reference.trim();
        if (!reference) continue;
        const key = `${task.type}:${reference.toLowerCase()}`;
        const existing = totals.get(key);
        if (existing) {
          // Atribuição integral: o tempo do registro conta inteiro para cada
          // task vinculada (nota de rodapé na tabela explica).
          existing.totalSeconds += entry.durationSeconds;
          existing.sessions += 1;
          existing.storyPoints = Math.max(existing.storyPoints, task.storyPoints);
        } else {
          totals.set(key, {
            reference,
            type: task.type,
            totalSeconds: entry.durationSeconds,
            sessions: 1,
            storyPoints: task.storyPoints,
          });
        }
      }
    }
    return Array.from(totals.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [entries]);

  const activeDays = useMemo(
    () => new Set(entries.map((e) => toLocalIsoDate(e.startTime.toDate()))).size,
    [entries]
  );

  const categoryPoints: CategoryPoints[] = useMemo(() => {
    const totals = new Map<string, CategoryPoints>();
    for (const entry of entries) {
      const points = (entry.tasks ?? []).reduce((s, t) => s + t.storyPoints, 0);
      if (points === 0) continue;
      const actionType = actionTypesById.get(entry.actionTypeId);
      const existing = totals.get(entry.actionTypeId);
      if (existing) {
        existing.totalPoints += points;
        existing.count += 1;
      } else {
        totals.set(entry.actionTypeId, {
          actionTypeId: entry.actionTypeId,
          name: actionType?.name ?? `${entry.actionTypeName} (excluída)`,
          colorTag: actionType?.colorTag,
          totalPoints: points,
          count: 1,
        });
      }
    }
    return Array.from(totals.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [entries, actionTypesById]);

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
      const dayKey = toLocalIsoDate(startDate);
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

  // Composição de cada dia por área (com jornada fixa o TOTAL diário é quase
  // constante — o que informa é a distribuição dentro do dia).
  const dailyComposition = useMemo(() => {
    const dayMap = new Map<string, { dayKey: string; row: DailyCompositionRow }>();
    const areaSet = new Set<string>();
    for (const entry of entries) {
      const area = actionTypesById.get(entry.actionTypeId)?.area ?? NO_AREA_LABEL;
      areaSet.add(area);
      const date = entry.startTime.toDate();
      const dayKey = toLocalIsoDate(date);
      let item = dayMap.get(dayKey);
      if (!item) {
        item = { dayKey, row: { dayLabel: formatDayLabel(date) } };
        dayMap.set(dayKey, item);
      }
      item.row[area] = ((item.row[area] as number | undefined) ?? 0) + entry.durationSeconds;
    }
    // Ordem estável de empilhamento: áreas na ordem cadastrada, "Sem área" no topo.
    const areas = [
      ...Array.from(areaSet)
        .filter((area) => area !== NO_AREA_LABEL)
        .sort((a, b) => (businessAreaOrder.get(a) ?? 0) - (businessAreaOrder.get(b) ?? 0)),
      ...(areaSet.has(NO_AREA_LABEL) ? [NO_AREA_LABEL] : []),
    ];
    const rows = Array.from(dayMap.values())
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
      .map((item) => item.row);
    return { rows, areas };
  }, [entries, actionTypesById, businessAreaOrder]);

  const PRESET_LABELS: Partial<Record<RangePreset, string>> = {
    today: "Hoje",
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    month: "Este mês",
    lastMonth: "Mês passado",
  };
  const periodLabel =
    PRESET_LABELS[preset] ??
    (activeCustomRange
      ? `${formatDayLabel(activeCustomRange.start)} a ${formatDayLabel(activeCustomRange.end)}`
      : "Período customizado");

  const topCategory =
    categoryTotals.length > 0 && kpis.totalSeconds > 0
      ? {
          name: categoryTotals[0].name,
          sharePercent: Math.round((categoryTotals[0].totalSeconds / kpis.totalSeconds) * 100),
        }
      : null;

  return (
    <div className="print-compact flex flex-col gap-8 print:gap-5">
      <PageHeader
        className="print:hidden"
        title="Dashboard"
        description="Evidência de onde o seu tempo foi gasto no período selecionado."
        actions={
          <>
            <DateRangeFilter
              preset={preset}
              customRange={activeCustomRange}
              onChange={setPreset}
              onCustomRangeChange={setCustomRange}
            />
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              Exportar / imprimir
            </Button>
          </>
        }
      />

      <div className="hidden print:block">
        <div className="flex items-baseline justify-between border-b pb-3">
          <h1 className="text-xl font-semibold">Relatório de tempo — PMTT</h1>
          <span className="text-sm text-muted-foreground">{periodLabel}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Gerado em {formatDateTimeLabel(new Date())}
        </p>
        <div className="mt-3">
          <ExecutiveSummary
            periodLabel={periodLabel}
            totalSeconds={kpis.totalSeconds}
            previousTotalSeconds={previousKpis?.totalSeconds ?? null}
            entryCount={kpis.entryCount}
            activeDays={activeDays}
            topCategory={topCategory}
            topArea={topArea}
            distinctTaskCount={taskAggregates.length}
            totalStoryPoints={kpis.totalStoryPoints}
          />
        </div>
      </div>

      <StatTiles
        totalSeconds={kpis.totalSeconds}
        entryCount={kpis.entryCount}
        taskCreatedPercent={kpis.taskCreatedPercent}
        totalStoryPoints={kpis.totalStoryPoints}
        secondsPerPoint={kpis.secondsPerPoint}
        topArea={topArea}
        previous={previousKpis}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-1 print:gap-4">
        <CategoryTotalsChart data={categoryTotals} />
        <DailyCompositionChart
          data={dailyComposition.rows}
          areas={dailyComposition.areas}
          colorFor={colorForArea}
        />
        <CategoryPointsChart data={categoryPoints} />
        <AreaTotalsChart data={areaTotals} colorFor={colorForArea} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:hidden">
        <WeekHourHeatmap entries={entries} />
        <WorkRhythmCard entries={entries} />
      </div>

      <CollapsibleSection
        title="Tempo por task"
        description="Cada task Jira/Movidesk trabalhada no período, com o tempo somado e o número de sessões — evidência direta do que foi entregue."
        count={taskAggregates.length}
        printVisible
      >
        <Card className="print:shadow-none">
          <CardContent>
            <TaskTimeTable data={taskAggregates} />
          </CardContent>
        </Card>
      </CollapsibleSection>

      <CollapsibleSection
        title="Frequência por dia"
        description="Quantas vezes cada categoria foi acionada no mesmo dia — útil pra ver rotinas que se repetem várias vezes num dia só."
        count={categoryDayFrequency.length}
        printVisible
      >
        <Card className="print:shadow-none">
          <CardContent>
            <CategoryFrequencyTable data={categoryDayFrequency} />
          </CardContent>
        </Card>
      </CollapsibleSection>

      <CollapsibleSection title="Registros do período" count={entries.length}>
        <Card>
          <CardContent>
            <EntriesTable
              entries={entries}
              actionTypesById={actionTypesById}
              onDelete={deleteEntry}
              onToggleTaskCreated={(id, value) => updateEntry(id, { taskCreated: value })}
              onEdit={setEditingEntry}
            />
          </CardContent>
        </Card>
      </CollapsibleSection>

      <EditEntryDialog
        entry={editingEntry}
        actionTypes={actionTypes}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSave={updateEntryFull}
      />
    </div>
  );
}
