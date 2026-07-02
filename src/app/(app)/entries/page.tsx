"use client";

import { useMemo, useState } from "react";
import { useActionTypes } from "@/hooks/use-action-types";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { rangeForPreset, type DateRange, type RangePreset } from "@/lib/time/ranges";
import { ManualEntryForm } from "@/components/entries/manual-entry-form";
import { EntriesTable } from "@/components/entries/entries-table";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EntriesPage() {
  const [preset, setPreset] = useState<Exclude<RangePreset, "custom">>("30d");
  const [selectedCustomRange, setSelectedCustomRange] = useState<DateRange | null>(null);
  const [activePreset, setActivePreset] = useState<RangePreset>("30d");

  const range = useMemo(() => {
    if (activePreset === "custom" && selectedCustomRange) return selectedCustomRange;
    return rangeForPreset(preset);
  }, [activePreset, preset, selectedCustomRange]);

  const { activeActionTypes, actionTypesById } = useActionTypes();
  const { entries, addManualEntry, deleteEntry, updateEntry } = useTimeEntries(range);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registros</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lançamentos do cronômetro e manuais, com filtro por período.
          </p>
        </div>
        <DateRangeFilter
          preset={activePreset}
          customRange={selectedCustomRange}
          onChange={(next) => {
            setPreset(next);
            setActivePreset(next);
          }}
          onCustomRangeChange={(span) => {
            setSelectedCustomRange(span);
            setActivePreset("custom");
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lançar manualmente</CardTitle>
        </CardHeader>
        <CardContent>
          <ManualEntryForm actionTypes={activeActionTypes} onCreate={addManualEntry} />
        </CardContent>
      </Card>

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
  );
}
