"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryColor } from "@/lib/palette";
import { formatDuration } from "@/lib/time/format";

export interface CategoryTotal {
  actionTypeId: string;
  name: string;
  colorTag: string | undefined;
  totalSeconds: number;
  count: number;
}

export function CategoryTotalsChart({ data }: { data: CategoryTotal[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tempo por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        </CardContent>
      </Card>
    );
  }

  const chartHeight = Math.max(160, data.length * 44);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tempo por categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} strokeOpacity={0.15} />
              <XAxis
                type="number"
                tickFormatter={(v) => formatDuration(v)}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <Tooltip
                formatter={(value, _name, item) => {
                  const count = (item?.payload as CategoryTotal | undefined)?.count;
                  const durationLabel = formatDuration(Number(value ?? 0));
                  return count != null ? `${durationLabel} · ${count}x` : durationLabel;
                }}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
              />
              <Bar dataKey="totalSeconds" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.actionTypeId} fill={categoryColor(entry.colorTag)} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  formatter={(value) => `${value ?? 0}x`}
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
