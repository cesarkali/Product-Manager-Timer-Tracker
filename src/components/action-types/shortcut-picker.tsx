"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SHORTCUT_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function ShortcutPicker({
  value,
  usedByOthers,
  onChange,
}: {
  value: number | null | undefined;
  /** Teclas já usadas por outras categorias — ficam desabilitadas na lista. */
  usedByOthers: Set<number>;
  onChange: (shortcutKey: number | null) => void;
}) {
  return (
    <Select
      value={value != null ? String(value) : "none"}
      onValueChange={(next) => onChange(next === "none" ? null : Number(next))}
    >
      <SelectTrigger className="w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Nenhum</SelectItem>
        {SHORTCUT_KEYS.map((key) => (
          <SelectItem key={key} value={String(key)} disabled={usedByOthers.has(key)}>
            {key}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
