"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { SidebarNavLinks } from "@/components/app-shell/sidebar-nav-links";
import { ActiveTimerIndicator } from "@/components/timer/active-timer-indicator";

export function Sidebar() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <aside className="print:hidden sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-background lg:flex">
      <div className="px-5 py-5">
        <span className="text-base font-semibold tracking-tight">Gestão de Tempo</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <SidebarNavLinks />
      </div>
      <div className="flex flex-col gap-3 border-t p-4">
        <ActiveTimerIndicator />
        {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          Sair
        </Button>
      </div>
    </aside>
  );
}
