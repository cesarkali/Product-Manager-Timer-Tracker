/** Áreas de negócio semeadas automaticamente no primeiro acesso à aba Áreas de
 * uma conta sem nenhuma área cadastrada (mesmo padrão de default-action-types.ts).
 * Eram uma lista fixa em código (AREA_OPTIONS); agora só o valor inicial de um
 * registro totalmente editável. */
export const DEFAULT_BUSINESS_AREAS: { name: string; colorTag: string }[] = [
  { name: "Suporte", colorTag: "0" },
  { name: "Desenvolvimento", colorTag: "1" },
  { name: "CS", colorTag: "2" },
  { name: "Gestão", colorTag: "3" },
  { name: "Financeiro", colorTag: "4" },
  { name: "Implantação", colorTag: "5" },
  { name: "Produto", colorTag: "6" },
  { name: "Outro", colorTag: "7" },
];
