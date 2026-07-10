/** Texto compacto do badge do ícone (cabem ~4 caracteres): "37m", "1h07", "12h". */
export function badgeText(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  if (hours >= 10) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

/** Verde rodando, âmbar pausado — mesmos tons da paleta de categorias do app. */
export const BADGE_COLOR_RUNNING = "#199e70";
export const BADGE_COLOR_PAUSED = "#c98500";
