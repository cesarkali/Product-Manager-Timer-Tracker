"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { SidebarNavLinks } from "@/components/app-shell/sidebar-nav-links";
import { ActiveTimerIndicator } from "@/components/timer/active-timer-indicator";
import { WhatsNew } from "@/components/app-shell/whats-new";
import { cn } from "@/lib/utils";

/** Gera iniciais a partir do email: "julio@caliberda.com.br" → "JC" */
function initials(email: string): string {
  const parts = email.split("@")[0]?.split(/[._-]/) ?? [];
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
}

export function Sidebar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { collapsed, setSidebarCollapsed } = useSidebarPreference();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const userInitials = user?.email ? initials(user.email) : "??";

  return (
    <aside
      className={cn(
        "print:hidden sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-background transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* ── Logo ─────────────────────────────────────── */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          <Image src="/icon.svg" alt="" width={36} height={36} priority />
        </div>

        {!collapsed && (
          <div className="min-w-0 leading-none">
            <span className="block truncate text-[15px] font-bold tracking-tight">PMTT</span>
            <p className="truncate text-[10.5px] text-muted-foreground">
              Product Manager Time Tracker
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4">
        <SidebarNavLinks collapsed={collapsed} />
      </div>

      {/* ── Rodapé ───────────────────────────────────── */}
      <div className="border-t px-2.5 py-3">
        {/* Novidades */}
        <WhatsNew collapsed={collapsed} />

        {/* Timer ativo */}
        <div className="mt-1">
          <ActiveTimerIndicator compact={collapsed} />
        </div>

        {/* Divisor sutil */}
        <div className="my-2.5 h-px bg-border" />

        {/* Avatar + email + ações */}
        <div className={cn("flex items-center gap-2.5", collapsed && "flex-col")}>
          {/* Avatar */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-bold text-primary ring-1 ring-primary/20"
            aria-hidden
          >
            {userInitials}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-medium leading-tight text-foreground">
                {user?.displayName ?? user?.email?.split("@")[0]}
              </p>
              <p className="truncate text-[10.5px] text-muted-foreground">{user?.email}</p>
            </div>
          )}

          {/* Botão sair */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    aria-label="Sair"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  />
                }
              >
                <LogOut className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sair"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Recolher / expandir */}
        <div className="mt-2.5">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(false)}
                    aria-label="Expandir menu"
                    className="flex w-full items-center justify-center rounded-lg py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  />
                }
              >
                <ChevronsRight className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent side="right">Expandir menu</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
              Recolher
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
