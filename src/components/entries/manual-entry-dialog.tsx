"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManualEntryForm } from "@/components/entries/manual-entry-form";
import type { ManualEntryInput } from "@/lib/validation";
import type { ActionType } from "@/lib/types";
import type { ManualEntryData } from "@/hooks/use-time-entries";

/** Lançamento manual em modal — usado pela timeline do dia para preencher uma
 * lacuna sem sair da página. O `key` no form garante reset a cada lacuna. */
export function ManualEntryDialog({
  open,
  onOpenChange,
  actionTypes,
  initialValues,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionTypes: ActionType[];
  initialValues?: Partial<ManualEntryInput>;
  onCreate: (data: ManualEntryData) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto sm:max-w-4xl lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Lançar registro</DialogTitle>
        </DialogHeader>
        <ManualEntryForm
          key={`${initialValues?.date ?? ""}T${initialValues?.startTime ?? ""}`}
          actionTypes={actionTypes}
          defaultValues={initialValues}
          onCreate={onCreate}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
