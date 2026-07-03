"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { SidebarNavLinks } from "@/components/app-shell/sidebar-nav-links";
import { ActiveTimerIndicator } from "@/components/timer/active-timer-indicator";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { collapsed, setSidebarCollapsed } = useSidebarPreference();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <aside
      className={cn(
        "print:hidden sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-background transition-[width] duration-200 lg:flex",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center gap-2 border-b px-5", collapsed && "justify-center px-0")}>
        <Image src="/icon.svg" alt="" width={26} height={26} className="shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-tight">PMTT</span>
            <p className="truncate text-[11px] text-muted-foreground">Product Manager Time Tracker</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SidebarNavLinks collapsed={collapsed} />
      </div>

      <div className={cn("flex flex-col gap-2 border-t p-3", collapsed && "items-center")}>
        <ActiveTimerIndicator compact={collapsed} />

        {!collapsed && user?.email && (
          <p className="truncate px-1 text-xs text-muted-foreground">{user.email}</p>
        )}

        <div className={cn("flex gap-2", collapsed ? "flex-col" : "flex-row")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => setSidebarCollapsed(false)}
                    aria-label="Expandir menu"
                  />
                }
              >
                <ChevronsRight className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent side="right">Expandir menu</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-1.5 text-muted-foreground"
              onClick={() => setSidebarCollapsed(true)}
            >
              <ChevronsLeft className="h-4 w-4" />
              Recolher
            </Button>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSignOut}
                    aria-label="Sair"
                  />
                }
              >
                <LogOut className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="outline" size="sm" className="flex-1" onClick={handleSignOut}>
              Sair
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
