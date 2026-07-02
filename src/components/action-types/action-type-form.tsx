"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconPicker } from "@/components/action-types/icon-picker";
import { actionTypeSchema, type ActionTypeInput } from "@/lib/validation";
import { ICON_KEYS } from "@/lib/icons";

export function ActionTypeForm({
  onCreate,
}: {
  onCreate: (name: string, icon: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(ICON_KEYS[0]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActionTypeInput>({ resolver: zodResolver(actionTypeSchema) });

  async function onSubmit(data: ActionTypeInput) {
    try {
      await onCreate(data.name, icon);
      reset();
      setIcon(ICON_KEYS[0]);
      setOpen(false);
    } catch {
      toast.error("Não foi possível criar a categoria.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Nova categoria</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="action-type-name">Nome da categoria</Label>
            <Input
              id="action-type-name"
              placeholder="Ex: Verificando incidentes no Movidesk"
              autoFocus
              {...register("name")}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Ícone</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
