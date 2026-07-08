"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DESCRIPTION_MAX_LENGTH } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Campo proeminente "O que você está fazendo?" do cronômetro + chips com as
 * descrições recentes da mesma categoria (1 clique preenche e salva). O valor
 * é persistido no blur/Enter (mesmo padrão do textarea de comentários), nunca
 * a cada tecla. */
export function QuickDescriptionInput({
  value,
  onChange,
  onCommit,
  suggestions,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Persiste o valor no timer ativo (onBlur/Enter/clique em chip). */
  onCommit: (value: string) => void;
  suggestions: string[];
}) {
  const [focused, setFocused] = useState(false);
  const visibleSuggestions = suggestions.filter(
    (s) => s.toLowerCase() !== value.trim().toLowerCase()
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onCommit(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit(value);
              e.currentTarget.blur();
            }
          }}
          placeholder="O que você está fazendo?"
          maxLength={DESCRIPTION_MAX_LENGTH}
          aria-label="Descrição rápida do que você está fazendo"
          className="h-11 pr-16 text-base"
        />
        <span
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground/70 transition-opacity",
            focused || value ? "opacity-100" : "opacity-0"
          )}
        >
          {value.length}/{DESCRIPTION_MAX_LENGTH}
        </span>
      </div>

      {visibleSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          {visibleSuggestions.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              render={
                <button
                  type="button"
                  onClick={() => {
                    onChange(suggestion);
                    onCommit(suggestion);
                  }}
                  className="max-w-64 cursor-pointer truncate transition-colors hover:bg-accent hover:text-accent-foreground"
                  title={suggestion}
                >
                  {suggestion}
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
