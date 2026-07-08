import { Suspense } from "react";
import { SettingsContent } from "@/components/settings/settings-content";

// useSearchParams exige Suspense no App Router (mesmo padrão do dashboard).
export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
