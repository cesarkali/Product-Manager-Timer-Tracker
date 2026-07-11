"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutDashboard, ListChecks, Settings, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/timer",     label: "Hoje",          icon: Sun },
  { href: "/entries",   label: "Registros",      icon: ListChecks },
  { href: "/dashboard", label: "Dashboard",      icon: LayoutDashboard },
  { href: "/atividade", label: "Atividade",      icon: History },
  // startsWith("/settings") também marca ativa a rota antiga redirecionada.
  { href: "/settings",  label: "Configurações",  icon: Settings },
];

export function SidebarNavLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav data-tour="nav" className="flex flex-col gap-0.5">
      {LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = pathname.startsWith(link.href);

        const linkEl = (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              // base
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
              // collapsed: centraliza
              collapsed && "justify-center px-0 py-3",
              // inativo
              !isActive && "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              // ativo
              isActive && "bg-primary/10 font-semibold text-primary"
            )}
          >
            {/* barra lateral do ativo */}
            {isActive && !collapsed && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
            )}

            {/* ícone com halo no ativo */}
            <span
              className={cn(
                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>

            {!collapsed && (
              <span className="truncate">{link.label}</span>
            )}
          </Link>
        );

        if (!collapsed) return linkEl;

        return (
          <Tooltip key={link.href}>
            <TooltipTrigger render={linkEl} />
            <TooltipContent side="right">{link.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
