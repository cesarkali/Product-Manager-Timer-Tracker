// Hooks React compartilhados entre popup e página de opções (ambos são páginas
// da extensão e falam com o Firebase diretamente, sem passar pelo service
// worker). Versões enxutas dos hooks do app web — mesma semântica.
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth/web-extension";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { ActionType, ActiveTimer } from "@/lib/types";
import { computeElapsedMs } from "../lib/timer-ops";
import { DEFAULT_SETTINGS, loadSettings, watchSettings, type ExtensionSettings } from "../lib/settings";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

export function useActiveTimerDoc(uid: string) {
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "users", uid, "activeTimer", "current");
    return onSnapshot(ref, (snap) => {
      setTimer(snap.exists() ? (snap.data() as ActiveTimer) : null);
      setLoading(false);
    });
  }, [uid]);

  return { timer, loading };
}

export function useActionTypesList(uid: string) {
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, "users", uid, "actionTypes");
    return onSnapshot(ref, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActionType);
      items.sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "pt-BR")
      );
      setActionTypes(items);
      setLoading(false);
    });
  }, [uid]);

  const active = useMemo(() => actionTypes.filter((a) => !a.archived), [actionTypes]);
  return { actionTypes, activeActionTypes: active, loading };
}

export function useExtensionSettings() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void loadSettings().then((loaded) => {
      if (!mounted) return;
      setSettings(loaded);
      setLoading(false);
    });
    watchSettings((next) => {
      if (mounted) setSettings(next);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { settings, setSettings, loading };
}

/** Segundos decorridos do timer, atualizando a cada segundo (congela pausado). */
export function useElapsedSeconds(timer: ActiveTimer | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer || timer.pausedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  if (!timer) return 0;
  return Math.floor(computeElapsedMs(timer, now) / 1000);
}

/** Aviso transitório estilo toast — some sozinho depois de alguns segundos. */
export function useNotice() {
  const [notice, setNotice] = useState<{ text: string; kind: "ok" | "error" } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timeout);
  }, [notice]);

  return {
    notice,
    showOk: (text: string) => setNotice({ text, kind: "ok" }),
    showError: (text: string) => setNotice({ text, kind: "error" }),
  };
}

export type Theme = "dark" | "light";

/** Persiste dark/light em chrome.storage.local e aplica classe no <html>. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    void chrome.storage.local.get("pmtt-theme").then((stored) => {
      const saved = stored["pmtt-theme"] as Theme | undefined;
      const resolved: Theme = saved === "light" ? "light" : "dark";
      setTheme(resolved);
      applyTheme(resolved);
    });
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      void chrome.storage.local.set({ "pmtt-theme": next });
      return next;
    });
  }

  return [theme, toggle];
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("light", t === "light");
}

