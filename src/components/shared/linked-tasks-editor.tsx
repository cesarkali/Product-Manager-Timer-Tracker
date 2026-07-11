"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STORY_POINT_OPTIONS, TASK_TYPE_LABELS, type LinkedTask } from "@/lib/types";

export function LinkedTasksEditor({
  items,
  onAdd,
  onRemove,
  onChangeItem,
}: {
  items: LinkedTask[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChangeItem: (index: number, patch: Partial<LinkedTask>) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2 rounded-md border p-2 sm:border-0 sm:p-0">
          <Select
            value={item.type}
            onValueChange={(value) => onChangeItem(index, { type: value as LinkedTask["type"] })}
          >
            <SelectTrigger className="w-[6.5rem] shrink-0 sm:w-[7.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TASK_TYPE_LABELS) as LinkedTask["type"][]).map((type) => (
                <SelectItem key={type} value={type}>
                  {TASK_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Link ou referência da task"
            value={item.reference}
            onChange={(e) => onChangeItem(index, { reference: e.target.value })}
            className="h-9 min-w-0 flex-1 basis-48"
          />

          <Select
            value={String(item.storyPoints)}
            onValueChange={(value) => onChangeItem(index, { storyPoints: Number(value) as LinkedTask["storyPoints"] })}
          >
            <SelectTrigger className="w-[4.5rem] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STORY_POINT_OPTIONS.map((points) => (
                <SelectItem key={points} value={String(points)}>
                  {points}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            aria-label="Remover task"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={onAdd} className="w-fit gap-1.5">
        <Plus className="h-4 w-4" />
        Adicionar task
      </Button>
    </div>
  );
}
