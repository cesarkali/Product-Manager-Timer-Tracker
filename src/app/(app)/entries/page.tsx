"use client";

import { useMemo, useState } from "react";
import { useActionTypes } from "@/hooks/use-action-types";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { rangeForPreset, type DateRange, type RangePreset } from "@/lib/time/ranges";
import { PageHeader } from "@/components/app-shell/page-header";
import { ManualEntryForm } from "@/components/entries/manual-entry-form";
import { EntriesTable } from "@/components/entries/entries-table";
import { EditEntryDialog } from "@/components/entries/edit-entry-dialog";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeEntry } from "@/lib/types";

// Mesmo conjunto do dashboard — presets unificados entre as duas telas.
const ENTRIES_PRESETS: { value: Exclude<RangePreset, "custom">; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "month", label: "Este mês" },
  { value: "lastMonth", label: "Mês passado" },
];

export default function EntriesPage() {
  const [preset, setPreset] = useState<Exclude<RangePreset, "custom">>("today");
  const [selectedCustomRange, setSelectedCustomRange] = useState<DateRange | null>(null);
  const [activePreset, setActivePreset] = useState<RangePreset>("today");

  const range = useMemo(() => {
    if (activePreset === "custom" && selectedCustomRange) return selectedCustomRange;
    return rangeForPreset(preset);
  }, [activePreset, preset, selectedCustomRange]);

  const { actionTypes, activeActionTypes, actionTypesById } = useActionTypes();
  const { entries, addManualEntry, deleteEntry, updateEntry, updateEntryFull } = useTimeEntries(range);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Registros"
        description="Lançamentos do cronômetro e manuais, com filtro por período."
        actions={
          <DateRangeFilter
            preset={activePreset}
            customRange={selectedCustomRange}
            presets={ENTRIES_PRESETS}
            onChange={(next) => {
              setPreset(next);
              setActivePreset(next);
            }}
            onCustomRangeChange={(span) => {
              setSelectedCustomRange(span);
              setActivePreset("custom");
            }}
          />
        }
      />

      <Card data-tour="manual-entry">
        <CardHeader>
          <CardTitle className="text-base">Lançar manualmente</CardTitle>
        </CardHeader>
        <CardContent>
          <ManualEntryForm actionTypes={activeActionTypes} onCreate={addManualEntry} />
        </CardContent>
      </Card>

      <Card data-tour="entries-table">
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

      <EditEntryDialog
        entry={editingEntry}
        actionTypes={actionTypes}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSave={updateEntryFull}
      />
    </div>
  );
}
