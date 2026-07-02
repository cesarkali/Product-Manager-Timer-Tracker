export interface PaletteSlot {
  light: string;
  dark: string;
}

export const CATEGORY_PALETTE: PaletteSlot[] = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#008300", dark: "#008300" },
  { light: "#4a3aa7", dark: "#9085e9" },
  { light: "#e34948", dark: "#e66767" },
  { light: "#e87ba4", dark: "#d55181" },
  { light: "#eb6834", dark: "#d95926" },
];

export const DELETED_CATEGORY_COLOR: PaletteSlot = { light: "#9ca3af", dark: "#6b7280" };

export function paletteSlotForIndex(index: number): PaletteSlot {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

// A UI roda só em modo escuro por padrão (ver plano), então os componentes usam
// diretamente a variante `dark` da paleta.
export function categoryColor(colorTag: string | undefined): string {
  const index = Number(colorTag);
  if (Number.isNaN(index)) return DELETED_CATEGORY_COLOR.dark;
  return paletteSlotForIndex(index).dark;
}
