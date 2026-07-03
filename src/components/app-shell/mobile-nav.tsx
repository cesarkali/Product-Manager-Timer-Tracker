"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { SidebarNavLinks } from "@/components/app-shell/sidebar-nav-links";
import { ActiveTimerIndicator } from "@/components/timer/active-timer-indicator";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <header className="print:hidden sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>PMTT</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col justify-between px-3 pb-4">
            <SidebarNavLinks onNavigate={() => setOpen(false)} />
            <SheetClose
              render={
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
              }
            />
          </div>
        </SheetContent>
      </Sheet>
      <span className="text-sm font-semibold">PMTT</span>
      <ActiveTimerIndicator compact />
    </header>
  );
}
