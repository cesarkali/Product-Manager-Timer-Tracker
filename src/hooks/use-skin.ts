"use client";

// Aparência do PMTT: temas completos (data-skin), densidade (data-density) e
// cantos (data-corners) no <html>, com overrides em globals.css.
//
// Estratégia de persistência em duas camadas:
//   1. localStorage  → aplica imediatamente (sem piscar) no boot script do RootLayout
//   2. Firestore     → fonte de verdade; sincroniza entre dispositivos
//
// No carregamento, o useAppearanceSync (chamado pelo Providers) lê o Firestore
// e, se houver valor diferente do localStorage, atualiza ambos.
import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { UserProfile } from "@/lib/types";

export const SKIN_STORAGE_KEY = "pmtt-skin";

export interface Skin {
  id: string;
  label: string;
  /** Cor de amostra do seletor. */
  swatch: string;
  /** Temas claros removem a classe .dark do <html>. */
  light?: boolean;
}

export const SKINS: Skin[] = [
  { id: "violeta", label: "Violeta", swatch: "oklch(0.68 0.16 288)" },
  { id: "oceano", label: "Oceano", swatch: "oklch(0.66 0.15 250)" },
  { id: "ciano", label: "Ciano", swatch: "oklch(0.73 0.12 210)" },
  { id: "esmeralda", label: "Esmeralda", swatch: "oklch(0.7 0.13 165)" },
  { id: "ambar", label: "Âmbar", swatch: "oklch(0.78 0.13 80)" },
  { id: "rosa", label: "Rosa", swatch: "oklch(0.7 0.16 350)" },
  { id: "vermelho", label: "Vermelho", swatch: "oklch(0.66 0.18 25)" },
  { id: "meia-noite", label: "Meia-noite", swatch: "oklch(0.2 0.02 282)" },
  { id: "grafite", label: "Grafite", swatch: "oklch(0.45 0 0)" },
  { id: "claro", label: "Claro", swatch: "oklch(0.93 0.03 288)", light: true },
  { id: "claro-neutro", label: "Claro neutro", swatch: "oklch(0.93 0 0)", light: true },
];

const DEFAULT_SKIN = "violeta";
const DEFAULT_DENSITY = "confortavel";
const DEFAULT_CORNERS = "padrao";

// ── Helpers de DOM ──────────────────────────────────────────────

function applySkin(id: string) {
  const root = document.documentElement;
  if (id === DEFAULT_SKIN) root.removeAttribute("data-skin");
  else root.setAttribute("data-skin", id);
  const isLight = SKINS.find((s) => s.id === id)?.light ?? false;
  root.classList.toggle("dark", !isLight);
}

function applyAttr(attribute: string, id: string, defaultId: string) {
  const root = document.documentElement;
  if (id === defaultId) root.removeAttribute(attribute);
  else root.setAttribute(attribute, id);
}

function lsSet(key: string, value: string, defaultValue: string) {
  try {
    if (value === defaultValue) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* seguro */ }
}

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

// ── Hook principal: lê Firestore e mantém sincronizado ──────────

export interface AppearanceState {
  skin: string;
  density: string;
  corners: string;
}

/** Sincroniza aparência Firestore → localStorage → DOM.
 * Deve ser chamado uma vez dentro do Providers (usuário autenticado). */
export function useAppearanceSync() {
  const { user } = useAuth();

  const [appearance, setAppearance] = useState<AppearanceState>({
    skin: lsGet(SKIN_STORAGE_KEY) ?? DEFAULT_SKIN,
    density: lsGet("pmtt-density") ?? DEFAULT_DENSITY,
    corners: lsGet("pmtt-corners") ?? DEFAULT_CORNERS,
  });

  // Subscreve o doc do usuário no Firestore e sincroniza para o DOM / localStorage.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as UserProfile;

      const skin = data.skin ?? DEFAULT_SKIN;
      const density = data.density ?? DEFAULT_DENSITY;
      const corners = data.corners ?? DEFAULT_CORNERS;

      // Atualiza DOM e localStorage só se houver diferença (evita loop).
      setAppearance((prev) => {
        if (prev.skin !== skin || prev.density !== density || prev.corners !== corners) {
          applySkin(skin);
          applyAttr("data-density", density, DEFAULT_DENSITY);
          applyAttr("data-corners", corners, DEFAULT_CORNERS);
          lsSet(SKIN_STORAGE_KEY, skin, DEFAULT_SKIN);
          lsSet("pmtt-density", density, DEFAULT_DENSITY);
          lsSet("pmtt-corners", corners, DEFAULT_CORNERS);
          return { skin, density, corners };
        }
        return prev;
      });
    });
    return unsub;
  }, [user]);

  /** Persiste no Firestore (e imediatamente no localStorage + DOM). */
  const save = useCallback(
    async (patch: Partial<AppearanceState>) => {
      if (!user) return;

      setAppearance((prev) => {
        const next = { ...prev, ...patch };

        if ("skin" in patch) { applySkin(next.skin); lsSet(SKIN_STORAGE_KEY, next.skin, DEFAULT_SKIN); }
        if ("density" in patch) { applyAttr("data-density", next.density, DEFAULT_DENSITY); lsSet("pmtt-density", next.density, DEFAULT_DENSITY); }
        if ("corners" in patch) { applyAttr("data-corners", next.corners, DEFAULT_CORNERS); lsSet("pmtt-corners", next.corners, DEFAULT_CORNERS); }

        return next;
      });

      await updateDoc(doc(db, "users", user.uid), patch);
    },
    [user]
  );

  return { appearance, save };
}

// ── Hooks individuais (compatibilidade com código existente) ────

/** Wrapper de compatibilidade: delegua para useAppearanceSync via contexto
 * se disponível, ou cai de volta para localStorage apenas (ex.: página de login). */
export function useSkin(): [string, (id: string) => void] {
  const [skin, setSkinState] = useState<string>(DEFAULT_SKIN);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SKIN_STORAGE_KEY);
      if (saved && SKINS.some((s) => s.id === saved)) {
        setSkinState(saved);
        applySkin(saved);
      }
    } catch { /* seguro */ }
  }, []);

  function setSkin(id: string) {
    setSkinState(id);
    applySkin(id);
    lsSet(SKIN_STORAGE_KEY, id, DEFAULT_SKIN);
    if (user) {
      void updateDoc(doc(db, "users", user.uid), { skin: id });
    }
  }

  return [skin, setSkin];
}

// ── Opções de layout ─────────────────────────────────────────────

export interface LayoutOption {
  id: string;
  label: string;
}

export const DENSITY_OPTIONS: LayoutOption[] = [
  { id: "confortavel", label: "Confortável" },
  { id: "compacto", label: "Compacto" },
];

export const CORNER_OPTIONS: LayoutOption[] = [
  { id: "reto", label: "Reto" },
  { id: "padrao", label: "Padrão" },
  { id: "redondo", label: "Redondo" },
];

function useHtmlAttributePref(
  attribute: string,
  storageKey: string,
  defaultId: string,
  validIds: string[],
  firestoreField: string
): [string, (id: string) => void] {
  const [value, setValueState] = useState(defaultId);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && validIds.includes(saved)) {
        setValueState(saved);
        document.documentElement.setAttribute(attribute, saved);
      }
    } catch { /* seguro */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setValue(id: string) {
    setValueState(id);
    applyAttr(attribute, id, defaultId);
    lsSet(storageKey, id, defaultId);
    if (user) {
      void updateDoc(doc(db, "users", user.uid), { [firestoreField]: id });
    }
  }

  return [value, setValue];
}

export function useDensity() {
  return useHtmlAttributePref(
    "data-density",
    "pmtt-density",
    DEFAULT_DENSITY,
    DENSITY_OPTIONS.map((o) => o.id),
    "density"
  );
}

export function useCorners() {
  return useHtmlAttributePref(
    "data-corners",
    "pmtt-corners",
    DEFAULT_CORNERS,
    CORNER_OPTIONS.map((o) => o.id),
    "corners"
  );
}
