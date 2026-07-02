import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";
import { categoryColor } from "@/lib/palette";

export interface CategoryDayFrequency {
  dayKey: string;
  dayLabel: string;
  actionTypeId: string;
  name: string;
  colorTag: string | undefined;
  icon: string | undefined;
  count: number;
}

export function CategoryFrequencyTable({ data }: { data: CategoryDayFrequency[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem dados no período para calcular frequência.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Vezes no dia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const color = categoryColor(row.colorTag);
            return (
              <TableRow key={`${row.dayKey}-${row.actionTypeId}`}>
                <TableCell>{row.dayLabel}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)` }}
                    >
                      <CategoryIcon icon={row.icon} className="h-3.5 w-3.5" style={{ color }} />
                    </span>
                    {row.name}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={row.count > 1 ? "default" : "outline"}>{row.count}x</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
