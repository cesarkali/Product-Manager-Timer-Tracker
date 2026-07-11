"use client";

import { PageHeader } from "@/components/app-shell/page-header";
import { ActivityLogPanel } from "@/components/settings/activity-log-panel";

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Atividade"
        description="Tudo que foi criado, editado ou excluído na sua conta — com restauração de exclusões."
      />
      <ActivityLogPanel />
    </div>
  );
}
