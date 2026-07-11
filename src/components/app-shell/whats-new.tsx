"use client";

// Botão "Novidades" da sidebar + diálogo com o changelog. Quando a versão do
// app (APP_VERSION) difere da última vista pelo usuário, um ponto pulsante
// chama atenção; abrir o diálogo marca a versão como vista.
import { useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserFlags } from "@/hooks/use-user-flags";
import { APP_VERSION, CHANGELOG } from "@/lib/changelog";
import { cn } from "@/lib/utils";

export function WhatsNew({ collapsed }: { collapsed?: boolean }) {
  const { hasUnseenChangelog, markChangelogSeen, resetOnboarding } = useUserFlags();
  const [open, setOpen] = useState(false);

  async function replayTour() {
    setOpen(false);
    await resetOnboarding(); // o wizard reabre sozinho via snapshot do perfil
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && hasUnseenChangelog) void markChangelogSeen();
  }

  const trigger = collapsed ? (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground"
            onClick={() => handleOpenChange(true)}
            aria-label="Novidades"
          />
        }
      >
        <Sparkles className="h-4 w-4" />
        {hasUnseenChangelog && <UnseenDot />}
      </TooltipTrigger>
      <TooltipContent side="right">Novidades</TooltipContent>
    </Tooltip>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      className="relative w-full justify-start gap-2 text-muted-foreground"
      onClick={() => handleOpenChange(true)}
    >
      <Sparkles className={cn("h-4 w-4", hasUnseenChangelog && "text-primary")} />
      Novidades
      {hasUnseenChangelog && (
        <span className="ml-auto inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
          v{APP_VERSION}
        </span>
      )}
    </Button>
  );

  return (
    <>
      <div data-tour="whats-new" className={cn(!collapsed && "w-full")}>
        {trigger}
      </div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[80vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b bg-muted/30 px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              Novidades do PMTT
            </DialogTitle>
            <DialogDescription>O que mudou nas últimas versões.</DialogDescription>
          </DialogHeader>
          <div className="scrollbar-thin max-h-[60vh] overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-7">
              {CHANGELOG.map((entry, entryIndex) => (
                <section key={entry.version}>
                  <header className="mb-3 flex items-baseline gap-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums",
                        entryIndex === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      v{entry.version}
                    </span>
                    <h3 className="text-sm font-semibold">{entry.title}</h3>
                    <time className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {new Date(`${entry.date}T12:00:00`).toLocaleDateString("pt-BR")}
                    </time>
                  </header>
                  <ul className="flex flex-col gap-2.5 border-l-2 border-primary/20 pl-4">
                    {entry.highlights.map((h) => (
                      <li key={h.title}>
                        <p className="text-[13px] font-semibold">{h.title}</p>
                        <p className="text-[13px] leading-relaxed text-muted-foreground">
                          {h.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
          <div className="border-t bg-muted/30 px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => void replayTour()}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Rever o tour de boas-vindas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UnseenDot() {
  return (
    <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
  );
}
