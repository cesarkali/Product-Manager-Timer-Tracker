"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { areaColor } from "@/lib/areas";
import { formatDuration } from "@/lib/time/format";

export interface AreaTotal {
  area: string;
  totalSeconds: number;
  /** Participação no tempo total do período (0-100). */
  sharePercent: number;
}

/** Distribuição do tempo por área de negócio — barras horizontais, mesmo
 * padrão visual do CategoryTotalsChart (identidade por cor da paleta fixa). */
export function AreaTotalsChart({ data }: { data: AreaTotal[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tempo por área</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        </CardContent>
      </Card>
    );
  }

  const chartHeight = Math.max(160, data.length * 44);

  return (
    <Card className="break-inside-avoid print:shadow-none">
      <CardHeader className="print:pb-2">
        <CardTitle className="print:text-base">Tempo por área</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32 }}>
              <CartesianGrid horizontal={false} strokeOpacity={0.15} />
              <XAxis
                type="number"
                tickFormatter={(v) => formatDuration(v)}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <YAxis
                type="category"
                dataKey="area"
                width={140}
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <Tooltip
                formatter={(value, _name, item) => {
                  const share = (item?.payload as AreaTotal | undefined)?.sharePercent;
                  const durationLabel = formatDuration(Number(value ?? 0));
                  return share != null ? `${durationLabel} · ${share}%` : durationLabel;
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                itemStyle={{ color: "var(--card-foreground)" }}
              />
              <Bar dataKey="totalSeconds" radius={[0, 4, 4, 0]}>
                {data.map((item) => (
                  <Cell key={item.area} fill={areaColor(item.area)} />
                ))}
                <LabelList
                  dataKey="sharePercent"
                  position="right"
                  formatter={(value) => `${value ?? 0}%`}
                  fill="currentColor"
                  className="fill-muted-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
