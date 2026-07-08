"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Anima um número até `target` (rAF + easeOutCubic) — usado nos KPIs para a
 * sensação de "painel vivo". Respeita `prefers-reduced-motion` (retorna o alvo
 * direto) e reanima a partir do valor atual quando o alvo muda. */
export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  valueRef.current = value;

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }
    const from = valueRef.current;
    if (from === target) return;
    let frameId: number;
    const startedAt = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      setValue(from + (target - from) * easeOutCubic(progress));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
