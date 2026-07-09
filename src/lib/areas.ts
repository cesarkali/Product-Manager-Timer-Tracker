import { CATEGORY_PALETTE, DELETED_CATEGORY_COLOR } from "@/lib/palette";

/** Áreas de negócio disponíveis para agrupar categorias no dashboard.
 * Lista fixa de propósito ("Outro" é a válvula de escape) — manter em sincronia
 * com o Select da tabela de categorias. */
export const AREA_OPTIONS = [
  "Suporte",
  "Desenvolvimento",
  "CS",
  "Gestão",
  "Financeiro",
  "Implantação",
  "Produto",
  "Outro",
] as const;

export type AreaOption = (typeof AREA_OPTIONS)[number];

export const NO_AREA_LABEL = "Sem área";

/** Cor estável por área (mesma paleta das categorias); "Sem área" fica cinza. */
export function areaColor(area: string | null | undefined): string {
  const index = AREA_OPTIONS.indexOf(area as AreaOption);
  if (index < 0) return DELETED_CATEGORY_COLOR.dark;
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length].dark;
}
