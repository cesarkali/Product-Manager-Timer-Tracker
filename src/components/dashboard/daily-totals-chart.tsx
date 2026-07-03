"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/time/format";

export interface DailyTotal {
  dayLabel: string;
  totalSeconds: number;
}

export function DailyTotalsChart({ data }: { data: DailyTotal[] }) {
  return (
    <Card className="break-inside-avoid print:shadow-none">
      <CardHeader className="print:pb-2">
        <CardTitle className="print:text-base">Tempo por dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis dataKey="dayLabel" stroke="currentColor" strokeOpacity={0.4} />
              <YAxis
                tickFormatter={(v) => formatDuration(v)}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <Tooltip
                formatter={(value) => formatDuration(Number(value ?? 0))}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                itemStyle={{ color: "var(--card-foreground)" }}
              />
              <Bar dataKey="totalSeconds" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
