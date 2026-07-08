"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Settings, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/timer", label: "Hoje", icon: Sun },
  { href: "/entries", label: "Registros", icon: ListChecks },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  // startsWith("/settings") também marca ativa a rota antiga redirecionada.
  { href: "/settings", label: "Configurações", icon: Settings },
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
    <nav className="flex flex-col gap-1.5">
      {LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = pathname.startsWith(link.href);
        const linkEl = (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              collapsed && "justify-center px-0",
              isActive && "bg-accent font-medium text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && link.label}
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
