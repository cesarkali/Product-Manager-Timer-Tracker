import { formatDuration } from "@/lib/time/format";

export interface ExecutiveSummaryInput {
  periodLabel: string;
  totalSeconds: number;
  previousTotalSeconds: number | null;
  entryCount: number;
  /** Dias distintos com pelo menos um registro. */
  activeDays: number;
  topCategory: { name: string; sharePercent: number } | null;
  topArea: { name: string; sharePercent: number } | null;
  distinctTaskCount: number;
  totalStoryPoints: number;
}

/** Gera 2-4 frases de narrativa automática para o relatório impresso — frases
 * condicionais: sem dado, sem frase. */
export function buildExecutiveSummary(input: ExecutiveSummaryInput): string[] {
  const sentences: string[] = [];
  if (input.entryCount === 0) {
    return [`Nenhuma atividade registrada no período (${input.periodLabel}).`];
  }

  let opening =
    `No período (${input.periodLabel}) foram registradas ` +
    `${formatDuration(input.totalSeconds)} em ${input.entryCount} ` +
    `${input.entryCount === 1 ? "atividade" : "atividades"}` +
    (input.activeDays > 1 ? ` ao longo de ${input.activeDays} dias` : "");
  if (input.previousTotalSeconds != null && input.previousTotalSeconds > 0) {
    const deltaPercent = Math.round(
      ((input.totalSeconds - input.previousTotalSeconds) / input.previousTotalSeconds) * 100
    );
    if (deltaPercent !== 0) {
      opening += ` — ${Math.abs(deltaPercent)}% ${deltaPercent > 0 ? "acima" : "abaixo"} do período anterior`;
    }
  }
  sentences.push(`${opening}.`);

  if (input.topCategory) {
    let focus = `A maior parte do tempo foi em "${input.topCategory.name}" (${input.topCategory.sharePercent}%)`;
    if (input.topArea) {
      focus += `, concentrado na área ${input.topArea.name} (${input.topArea.sharePercent}% do total)`;
    }
    sentences.push(`${focus}.`);
  }

  if (input.distinctTaskCount > 0) {
    let tasks = `Foram trabalhadas ${input.distinctTaskCount} ${input.distinctTaskCount === 1 ? "task distinta" : "tasks distintas"}`;
    if (input.totalStoryPoints > 0) {
      tasks += ` somando ${input.totalStoryPoints} story points`;
    }
    sentences.push(`${tasks}.`);
  }

  return sentences;
}

/** Bloco de resumo executivo — visível só na impressão (o chamador aplica
 * `hidden print:block`), pronto para apresentar à gestão em 1 minuto. */
export function ExecutiveSummary(props: ExecutiveSummaryInput) {
  const sentences = buildExecutiveSummary(props);
  return (
    <div className="rounded-md border p-4">
      <h2 className="text-sm font-semibold">Resumo executivo</h2>
      <p className="mt-2 text-sm leading-relaxed">{sentences.join(" ")}</p>
    </div>
  );
}
