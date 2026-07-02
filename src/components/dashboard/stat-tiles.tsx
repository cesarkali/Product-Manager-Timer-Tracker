import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/time/format";

export function StatTiles({
  totalSeconds,
  entryCount,
  taskCreatedPercent,
}: {
  totalSeconds: number;
  entryCount: number;
  taskCreatedPercent: number;
}) {
  const stats = [
    { label: "Tempo total no período", value: formatDuration(totalSeconds) },
    { label: "Registros", value: String(entryCount) },
    { label: "Com task criada", value: `${taskCreatedPercent}%` },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="gap-2 py-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
