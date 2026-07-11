// Página de opções da extensão: conta, templates de comentário e as regras de
// automação por domínio. Tudo salva automaticamente (debounce) no
// chrome.storage.sync. Layout de página única com grid responsivo.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Globe,
  MessageSquareText,
  Palette,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import { signOut } from "firebase/auth/web-extension";
import { auth } from "../lib/firebase";
import { EXT_SKINS, useActionTypesList, useAuthState, useSkin } from "../shared/hooks";
import { LoginForm } from "../shared/login-form";
import {
  loadSettings,
  saveSettings,
  type DomainRule,
  type ExtensionSettings,
} from "../lib/settings";
import type { ActionType } from "@/lib/types";

export function App() {
  const { user, loading: authLoading } = useAuthState();
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!settings) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      void saveSettings(settings).then(() => setSavedAt(Date.now()));
    }, 600);
    return () => clearTimeout(timeout);
  }, [settings]);

  useEffect(() => {
    if (!savedAt) return;
    const timeout = setTimeout(() => setSavedAt(null), 2400);
    return () => clearTimeout(timeout);
  }, [savedAt]);

  if (!settings) {
    return <p className="opt-muted opt-loading">Carregando…</p>;
  }

  function patch(partial: Partial<ExtensionSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  return (
    <div className="opt-page">
      {/* ── Cabeçalho ──────────────────────────────── */}
      <header className="opt-header">
        <div className="opt-header-brand">
          <span className="opt-brand-dot" />
          <div>
            <h1>PMTT Timer</h1>
            <p className="opt-subtitle">Opções da extensão — tudo salva automaticamente.</p>
          </div>
        </div>
        <span className={`opt-saved${savedAt ? " is-visible" : ""}`}>
          <Check size={13} /> Alterações salvas
        </span>
      </header>

      {/* ── Grid principal ─────────────────────────── */}
      <div className="opt-grid">

        {/* Coluna esquerda */}
        <div className="opt-col">

          {/* Conta */}
          <section className="opt-card">
            <h2><UserRound size={15} /> Conta</h2>
            {authLoading ? (
              <p className="opt-muted">Verificando sessão…</p>
            ) : user ? (
              <div className="opt-account">
                <div className="opt-account-info">
                  <span className="opt-account-avatar">{avatarInitials(user.email ?? "")}</span>
                  <div>
                    <p className="opt-account-name">{user.displayName ?? user.email?.split("@")[0]}</p>
                    <p className="opt-account-email">{user.email}</p>
                  </div>
                </div>
                <button type="button" className="opt-btn opt-btn-danger" onClick={() => void signOut(auth)}>
                  Sair
                </button>
              </div>
            ) : (
              <LoginForm />
            )}
          </section>

          {/* Aparência */}
          <section className="opt-card">
            <h2><Palette size={15} /> Aparência</h2>
            <p className="opt-muted">
              Tema de cor do popup e desta página. O modo claro/escuro fica no botão do popup.
            </p>
            <SkinCard />
          </section>

        </div>

        {/* Coluna direita */}
        <div className="opt-col">

          {/* Templates */}
          <section className="opt-card">
            <h2><MessageSquareText size={15} /> Templates de comentário</h2>
            <p className="opt-muted">
              Textos fixos inseridos com um clique nos comentários do timer.
            </p>
            <div className="opt-list">
              {settings.commentTemplates.map((template, index) => (
                <div key={index} className="opt-row">
                  <input
                    type="text"
                    value={template}
                    onChange={(e) => {
                      const next = [...settings.commentTemplates];
                      next[index] = e.target.value;
                      patch({ commentTemplates: next });
                    }}
                  />
                  <button
                    type="button"
                    className="opt-btn opt-btn-ghost"
                    title="Remover template"
                    onClick={() =>
                      patch({
                        commentTemplates: settings.commentTemplates.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="opt-btn"
              onClick={() => patch({ commentTemplates: [...settings.commentTemplates, ""] })}
            >
              <Plus size={14} /> Adicionar template
            </button>
          </section>

          {/* Regras por domínio */}
          <section className="opt-card">
            <h2><Globe size={15} /> Regras por domínio</h2>
            <p className="opt-muted">
              Quando a aba ativa casar com o padrão e não houver cronômetro rodando, o Chrome mostra
              uma notificação para iniciar a categoria certa. A troca nunca é automática.
            </p>
            <label className="opt-check">
              <input
                type="checkbox"
                checked={settings.notifyWhileRunning}
                onChange={(e) => patch({ notifyWhileRunning: e.target.checked })}
              />
              <span>Notificar também com cronômetro rodando (sugere trocar de categoria)</span>
            </label>
            {user ? (
              <RulesEditor uid={user.uid} settings={settings} patch={patch} />
            ) : (
              <p className="opt-muted">Entre na conta para configurar as regras.</p>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

function avatarInitials(email: string): string {
  const parts = email.split("@")[0]?.split(/[._-]/) ?? [];
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
}

function SkinCard() {
  const [skin, setSkin] = useSkin();
  return (
    <div className="opt-skins">
      {EXT_SKINS.map((option) => {
        const active = option.id === skin;
        return (
          <button
            key={option.id}
            type="button"
            className={`opt-skin${active ? " is-active" : ""}`}
            title={option.label}
            onClick={() => setSkin(option.id)}
          >
            <span className="opt-skin-dot" style={{ backgroundColor: option.swatch }}>
              {active ? <Check size={13} /> : null}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function RulesEditor({
  uid,
  settings,
  patch,
}: {
  uid: string;
  settings: ExtensionSettings;
  patch: (partial: Partial<ExtensionSettings>) => void;
}) {
  const { activeActionTypes, loading } = useActionTypesList(uid);

  const typesById = useMemo(() => {
    const map = new Map<string, ActionType>();
    for (const item of activeActionTypes) map.set(item.id, item);
    return map;
  }, [activeActionTypes]);

  if (loading) return <p className="opt-muted">Carregando categorias…</p>;
  if (activeActionTypes.length === 0) {
    return <p className="opt-muted">Nenhuma categoria ativa no PMTT — crie uma primeiro.</p>;
  }

  function updateRule(id: string, partial: Partial<DomainRule>) {
    patch({
      domainRules: settings.domainRules.map((rule) =>
        rule.id === id ? { ...rule, ...partial } : rule
      ),
    });
  }

  return (
    <>
      {settings.domainRules.length > 0 && (
        <div className="opt-rules-head">
          <span>Padrão de URL</span>
          <span>Categoria</span>
          <span>Notificar</span>
          <span>Repetir após (min)</span>
          <span />
        </div>
      )}
      <div className="opt-list">
        {settings.domainRules.map((rule) => (
          <div key={rule.id} className="opt-rule-row">
            <input
              type="text"
              value={rule.pattern}
              placeholder="ex.: bitz.movidesk.com"
              onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
            />
            <select
              value={rule.actionTypeId}
              onChange={(e) => {
                const actionType = typesById.get(e.target.value);
                updateRule(rule.id, {
                  actionTypeId: e.target.value,
                  actionTypeName: actionType?.name ?? "",
                });
              }}
            >
              {activeActionTypes.map((actionType) => (
                <option key={actionType.id} value={actionType.id}>
                  {actionType.name}
                </option>
              ))}
            </select>
            <input
              type="checkbox"
              checked={rule.notify}
              title="Mostrar notificação"
              onChange={(e) => updateRule(rule.id, { notify: e.target.checked })}
            />
            <input
              type="number"
              min={1}
              max={480}
              value={rule.cooldownMinutes}
              onChange={(e) =>
                updateRule(rule.id, {
                  cooldownMinutes: Math.max(1, Number(e.target.value) || 15),
                })
              }
            />
            <button
              type="button"
              className="opt-btn opt-btn-ghost"
              title="Remover regra"
              onClick={() =>
                patch({ domainRules: settings.domainRules.filter((r) => r.id !== rule.id) })
              }
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="opt-btn"
        onClick={() => {
          const first = activeActionTypes[0];
          const rule: DomainRule = {
            id: crypto.randomUUID(),
            pattern: "",
            actionTypeId: first.id,
            actionTypeName: first.name,
            notify: true,
            cooldownMinutes: 15,
          };
          patch({ domainRules: [...settings.domainRules, rule] });
        }}
      >
        <Plus size={14} /> Adicionar regra
      </button>
    </>
  );
}
