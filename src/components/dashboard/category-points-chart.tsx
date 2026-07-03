"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryColor } from "@/lib/palette";

export interface CategoryPoints {
  actionTypeId: string;
  name: string;
  colorTag: string | undefined;
  totalPoints: number;
  count: number;
}

export function CategoryPointsChart({ data }: { data: CategoryPoints[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pontos de complexidade por categoria</CardTitle>
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
        <CardTitle className="print:text-base">Pontos de complexidade por categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} strokeOpacity={0.15} />
              <XAxis type="number" stroke="currentColor" strokeOpacity={0.4} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <Tooltip
                formatter={(value, _name, item) => {
                  const count = (item?.payload as CategoryPoints | undefined)?.count;
                  return count != null ? `${value ?? 0} pontos · ${count}x` : `${value ?? 0} pontos`;
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                itemStyle={{ color: "var(--card-foreground)" }}
              />
              <Bar dataKey="totalPoints" radius={[0, 4, 4, 0]}>
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
