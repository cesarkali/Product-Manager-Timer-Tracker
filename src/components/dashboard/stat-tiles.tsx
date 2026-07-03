import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/time/format";

export function StatTiles({
  totalSeconds,
  entryCount,
  taskCreatedPercent,
  totalStoryPoints,
  secondsPerPoint,
}: {
  totalSeconds: number;
  entryCount: number;
  taskCreatedPercent: number;
  totalStoryPoints: number;
  secondsPerPoint: number | null;
}) {
  const stats = [
    { label: "Tempo total no período", value: formatDuration(totalSeconds) },
    { label: "Registros", value: String(entryCount) },
    { label: "Com task criada", value: `${taskCreatedPercent}%` },
    { label: "Total de pontos", value: String(totalStoryPoints) },
    { label: "Tempo por ponto", value: secondsPerPoint == null ? "—" : formatDuration(secondsPerPoint) },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 print:grid-cols-5 print:gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="gap-2 py-6 print:gap-1 print:border-border print:py-3 print:shadow-none">
          <CardContent className="print:px-3">
            <p className="text-sm text-muted-foreground print:text-xs">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight print:mt-1 print:text-xl">
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
