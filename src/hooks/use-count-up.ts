"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Anima um número até `target` (rAF + easeOutCubic) — usado nos KPIs para a
 * sensação de "painel vivo". Com `prefers-reduced-motion`, salta direto para o
 * alvo no primeiro frame; quando o alvo muda, reanima a partir do valor atual. */
export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(target);
  // Último valor exibido — escrito só dentro do rAF (nunca durante o render).
  const latestValueRef = useRef(target);

  useEffect(() => {
    const from = latestValueRef.current;
    if (from === target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId: number;
    const startedAt = performance.now();
    function tick(now: number) {
      const progress = reduceMotion ? 1 : Math.min(1, (now - startedAt) / durationMs);
      const next = from + (target - from) * easeOutCubic(progress);
      latestValueRef.current = next;
      setValue(next);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return value;
}
