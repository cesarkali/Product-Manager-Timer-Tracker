"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionTypesPanel } from "@/components/action-types/action-types-panel";
import { PreferencesPanel } from "@/components/settings/preferences-panel";

const TABS = ["categorias", "preferencias"] as const;
type SettingsTab = (typeof TABS)[number];

export function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: SettingsTab = TABS.includes(rawTab as SettingsTab)
    ? (rawTab as SettingsTab)
    : "categorias";

  function setTab(next: SettingsTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Categorias de atividade e preferências de uso.
        </p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as SettingsTab)}>
        <TabsList>
          <TabsTrigger value="categorias" className="px-4">
            Categorias
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="px-4">
            Preferências
          </TabsTrigger>
        </TabsList>
        <TabsContent value="categorias" className="mt-4">
          <ActionTypesPanel />
        </TabsContent>
        <TabsContent value="preferencias" className="mt-4">
          <PreferencesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
