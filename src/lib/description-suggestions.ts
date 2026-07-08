import type { TimeEntry } from "@/lib/types";

/** Últimas descrições distintas usadas na categoria — viram chips de 1 clique
 * no cronômetro. `entries` já vem ordenado por startTime desc (query padrão),
 * então basta varrer na ordem e deduplicar (case-insensitive). */
export function recentDescriptions(
  entries: TimeEntry[],
  actionTypeId: string,
  max = 5
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of entries) {
    if (entry.actionTypeId !== actionTypeId) continue;
    const description = entry.description?.trim();
    if (!description) continue;
    const key = description.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(description);
    if (result.length >= max) break;
  }
  return result;
}
