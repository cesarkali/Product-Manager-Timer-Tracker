"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, LayoutDashboard, ListChecks, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/timer", label: "Cronômetro", icon: Clock },
  { href: "/entries", label: "Registros", icon: ListChecks },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings/action-types", label: "Categorias", icon: Tags },
];

export function SidebarNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              isActive && "bg-accent font-medium text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
