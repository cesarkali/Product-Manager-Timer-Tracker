"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/time/format";
import type { TimeEntry } from "@/lib/types";

/** Seg..dom na ordem de exibição (linha 0 = segunda). */
const ROW_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOUR_MS = 60 * 60_000;

/** Tom único sequencial (azul da posição 1 da paleta) — o heatmap compara
 * magnitude, não identidade entre séries. */
const HEAT_COLOR = "#3987e5";

interface HeatmapData {
  /** [dia 0-6 (getDay)][hora 0-23] = segundos trabalhados. */
  matrix: number[][];
  maxSeconds: number;
  firstHour: number;
  lastHour: number;
}

function buildMatrix(entries: TimeEntry[]): HeatmapData {
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const entry of entries) {
    // Distribui o intervalo real (start→end) pelas fronteiras de hora. Usa o
    // intervalo bruto (sem descontar pausas) de propósito: é visualização de
    // padrão de rotina, não contabilidade.
    let cursor = entry.startTime.toMillis();
    const endMs = entry.endTime.toMillis();
    while (cursor < endMs) {
      const cursorDate = new Date(cursor);
      const hourEnd = Math.min(endMs, (Math.floor(cursor / HOUR_MS) + 1) * HOUR_MS);
      matrix[cursorDate.getDay()][cursorDate.getHours()] += (hourEnd - cursor) / 1000;
      cursor = hourEnd;
    }
  }

  let maxSeconds = 0;
  let firstHour = 8;
  let lastHour = 19;
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const value = matrix[day][hour];
      if (value <= 0) continue;
      maxSeconds = Math.max(maxSeconds, value);
      firstHour = Math.min(firstHour, hour);
      lastHour = Math.max(lastHour, hour);
    }
  }
  return { matrix, maxSeconds, firstHour, lastHour };
}

/** Mapa de calor semana × hora: quando o trabalho acontece. Grid CSS próprio
 * (não Recharts) com escala de tom único; célula vazia é visualmente distinta
 * do valor baixo. Fora da impressão (`print:hidden` no chamador). */
export function WeekHourHeatmap({ entries }: { entries: TimeEntry[] }) {
  const { matrix, maxSeconds, firstHour, lastHour } = useMemo(() => buildMatrix(entries), [entries]);
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);

  if (maxSeconds === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quando você trabalha</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quando você trabalha</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Colunas flexíveis (minmax(0,1fr)): a grade preenche exatamente a
            largura do card em qualquer tamanho de tela; a altura da célula é
            fixa (h-4), então o mapa nunca "estoura" verticalmente. */}
        <div
          className="grid w-full gap-[3px]"
          style={{ gridTemplateColumns: `2rem repeat(${hours.length}, minmax(0, 1fr))` }}
        >
          {ROW_ORDER.map((day) => (
            <div key={day} className="contents">
              <span className="flex items-center pr-1 text-[10px] text-muted-foreground">
                {DAY_LABELS[day]}
              </span>
              {hours.map((hour) => {
                const seconds = matrix[day][hour];
                // Piso de 12% garante que valores pequenos continuem visíveis.
                const intensity = seconds > 0 ? 12 + 68 * (seconds / maxSeconds) : 0;
                return (
                  <div
                    key={hour}
                    title={`${DAY_LABELS[day]} ${hour}h — ${seconds > 0 ? formatDuration(Math.round(seconds)) : "sem registro"}`}
                    className="h-4 w-full min-w-0 rounded-[3px]"
                    style={{
                      backgroundColor:
                        seconds > 0
                          ? `color-mix(in oklch, ${HEAT_COLOR} ${intensity}%, var(--card))`
                          : "color-mix(in oklch, var(--muted) 45%, transparent)",
                    }}
                  />
                );
              })}
            </div>
          ))}
          <span />
          {hours.map((hour) => (
            <span
              key={hour}
              className="whitespace-nowrap text-[10px] tabular-nums text-muted-foreground"
            >
              {hour % 2 === 0 ? `${hour}h` : ""}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 pl-8 text-[10px] text-muted-foreground">
          menos
          {[15, 35, 55, 80].map((intensity) => (
            <span
              key={intensity}
              className="h-3 w-3 rounded-[3px]"
              style={{
                backgroundColor: `color-mix(in oklch, ${HEAT_COLOR} ${intensity}%, var(--card))`,
              }}
            />
          ))}
          mais
        </div>
      </CardContent>
    </Card>
  );
}
