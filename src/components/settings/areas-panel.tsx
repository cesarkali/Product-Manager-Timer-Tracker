"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useBusinessAreas } from "@/hooks/use-business-areas";
import { DEFAULT_BUSINESS_AREAS } from "@/lib/default-business-areas";
import { BusinessAreaTable } from "@/components/settings/business-area-table";
import { ColorPicker } from "@/components/action-types/color-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Painel de gestão de áreas de negócio — aba "Áreas" de /settings. CRUD
 * completo (criar, renomear, recolorir, arquivar/reativar, excluir), mesmo
 * padrão da tabela de categorias. Excluir uma área nunca apaga categorias:
 * elas só voltam para "Sem área" (ver useBusinessAreas.deleteBusinessArea). */
export function AreasPanel() {
  const {
    businessAreas,
    loading,
    createBusinessArea,
    renameBusinessArea,
    setBusinessAreaColor,
    setBusinessAreaArchived,
    deleteBusinessArea,
    restoreDefaultBusinessAreas,
  } = useBusinessAreas();
  const [name, setName] = useState("");
  const [colorTag, setColorTag] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const existingNames = new Set(businessAreas.map((a) => a.name.toLowerCase()));
  const missingDefaultsCount = DEFAULT_BUSINESS_AREAS.filter(
    (d) => !existingNames.has(d.name.toLowerCase())
  ).length;

  async function handleRestore() {
    setRestoring(true);
    try {
      await restoreDefaultBusinessAreas();
      toast.success("Áreas padrão restauradas.");
    } catch {
      toast.error("Não foi possível restaurar as áreas padrão.");
    } finally {
      setRestoring(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await createBusinessArea(trimmed, colorTag);
      setName("");
      setColorTag("0");
      toast.success("Área cadastrada.");
    } catch {
      toast.error("Não foi possível cadastrar a área.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm text-muted-foreground">
        As áreas de negócio agrupam categorias no dashboard (&quot;Tempo por área&quot;).
        Cadastre, recolora, renomeie, arquive ou exclua áreas aqui — inclusive as áreas
        padrão do sistema. Elas aparecem no seletor de área de cada categoria, em
        Configurações → Categorias.
      </p>

      <Card>
        <CardContent className="flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-area-name">Nova área</Label>
              <Input
                id="new-area-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Marketing"
                maxLength={120}
                className="w-56"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cor</Label>
              <ColorPicker value={colorTag} onChange={setColorTag} />
            </div>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Cadastrando..." : "Cadastrar área"}
            </Button>
          </form>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              {missingDefaultsCount > 0 && (
                <div className="flex flex-col items-start gap-2 rounded-md border border-dashed p-4">
                  <p className="text-sm text-muted-foreground">
                    {businessAreas.length === 0
                      ? "Nenhuma área encontrada. Se você espera que as áreas padrão tivessem sido criadas automaticamente, pode restaurá-las aqui."
                      : `Faltam ${missingDefaultsCount} área(s) padrão do sistema — pode ser que o seed automático não tenha rodado.`}
                  </p>
                  <Button size="sm" variant="outline" onClick={handleRestore} disabled={restoring}>
                    {restoring ? "Restaurando..." : "Restaurar áreas padrão"}
                  </Button>
                </div>
              )}
              <BusinessAreaTable
                businessAreas={businessAreas}
                onRename={renameBusinessArea}
                onColorChange={setBusinessAreaColor}
                onArchiveToggle={setBusinessAreaArchived}
                onDelete={deleteBusinessArea}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
