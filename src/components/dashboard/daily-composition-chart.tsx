"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NO_AREA_LABEL } from "@/lib/areas";
import { formatDuration } from "@/lib/time/format";

/** Uma linha por dia; cada área presente vira uma chave dinâmica com os
 * segundos daquele dia. */
export interface DailyCompositionRow {
  dayLabel: string;
  [area: string]: number | string;
}

/** Substitui o antigo "Tempo por dia": com jornada fixa o total diário é quase
 * constante (~8h) e não informa nada — o que varia é a COMPOSIÇÃO do dia.
 * Barras empilhadas por área: a altura ainda mostra o total, e os segmentos
 * mostram para onde o dia foi. */
export function DailyCompositionChart({
  data,
  areas,
  colorFor,
}: {
  data: DailyCompositionRow[];
  /** Áreas presentes no período, na ordem de empilhamento (Sem área por último). */
  areas: string[];
  colorFor: (area: string) => string;
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Composição do dia por área</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        </CardContent>
      </Card>
    );
  }

  const onlyNoArea = areas.length === 1 && areas[0] === NO_AREA_LABEL;

  // Ticks do eixo Y em horas cheias ("2h, 4h, 6h...") — formatDuration completo
  // ("8h 20m 00s") quebrava em duas linhas e cortava no topo do gráfico.
  const maxTotalSeconds = Math.max(
    ...data.map((row) => areas.reduce((sum, area) => sum + (Number(row[area]) || 0), 0))
  );
  const maxHours = Math.max(1, Math.ceil(maxTotalSeconds / 3600));
  const stepHours = maxHours > 8 ? 2 : 1;
  const topHours = Math.ceil(maxHours / stepHours) * stepHours;
  const yTicks = Array.from({ length: topHours / stepHours + 1 }, (_, i) => i * stepHours * 3600);

  return (
    <Card className="break-inside-avoid print:shadow-none">
      <CardHeader className="print:pb-2">
        <CardTitle className="print:text-base">Composição do dia por área</CardTitle>
      </CardHeader>
      {/* flex-1 no wrapper do gráfico: quando o card divide a linha com um
          vizinho mais alto (grid estica os dois), o gráfico cresce junto em
          vez de deixar espaço vazio dentro do card. */}
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="w-full flex-1" style={{ minHeight: 220 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <YAxis
                domain={[0, topHours * 3600]}
                ticks={yTicks}
                tickFormatter={(v) => `${v / 3600}h`}
                width={40}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <Tooltip
                formatter={(value, name) => [formatDuration(Number(value ?? 0)), name]}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                itemStyle={{ color: "var(--card-foreground)" }}
              />
              {areas.map((area, index) => (
                <Bar
                  key={area}
                  dataKey={area}
                  stackId="day"
                  fill={colorFor(area)}
                  // Só o segmento do topo da pilha ganha canto arredondado.
                  radius={index === areas.length - 1 ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {areas.map((area) => (
            <span key={area} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colorFor(area) }}
              />
              {area}
            </span>
          ))}
        </div>

        {onlyNoArea && (
          <p className="text-xs text-muted-foreground">
            Dica: atribua áreas às suas categorias (Configurações → Categorias) para ver a
            composição colorida de cada dia.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
