import { categoryColor, DELETED_CATEGORY_COLOR } from "@/lib/palette";
import type { BusinessArea } from "@/lib/types";

export const NO_AREA_LABEL = "Sem área";

/** Resolve a cor de uma área a partir do registro (`BusinessArea.colorTag`,
 * mesma paleta das categorias). Área não encontrada (excluída, ou "Sem área")
 * cai no cinza de "excluída" — mesmo tratamento das categorias excluídas. */
export function areaColor(
  area: string | null | undefined,
  businessAreas: BusinessArea[]
): string {
  if (!area) return DELETED_CATEGORY_COLOR.dark;
  const match = businessAreas.find((a) => a.name === area);
  if (!match) return DELETED_CATEGORY_COLOR.dark;
  return categoryColor(match.colorTag);
}
