// Página de opções da extensão: conta, link do PMTT publicado, widget,
// templates de comentário e as regras de automação por domínio. Tudo salva
// automaticamente (debounce) no chrome.storage.sync.
import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth/web-extension";
import { auth } from "../lib/firebase";
import { useActionTypesList, useAuthState } from "../shared/hooks";
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

  if (!settings) {
    return <p className="opt-muted">Carregando…</p>;
  }

  function patch(partial: Partial<ExtensionSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  return (
    <div className="opt-page">
      <header className="opt-header">
        <h1>
          <span className="opt-brand-dot" /> PMTT Timer — Opções
        </h1>
        {savedAt ? <span className="opt-saved">Alterações salvas ✓</span> : null}
      </header>

      <section className="opt-card">
        <h2>Conta</h2>
        {authLoading ? (
          <p className="opt-muted">Verificando sessão…</p>
        ) : user ? (
          <div className="opt-account">
            <span>
              Conectado como <strong>{user.email}</strong>
            </span>
            <button type="button" className="opt-btn" onClick={() => void signOut(auth)}>
              Sair
            </button>
          </div>
        ) : (
          <LoginForm />
        )}
      </section>

      <section className="opt-card">
        <h2>Aplicativo</h2>
        <label className="opt-field">
          <span>URL do PMTT publicado (habilita o botão "Abrir PMTT" no popup)</span>
          <input
            type="url"
            value={settings.appUrl}
            placeholder="https://seu-pmtt.vercel.app"
            onChange={(e) => patch({ appUrl: e.target.value.trim() })}
          />
        </label>
      </section>

      <section className="opt-card">
        <h2>Widget no Movidesk e Jira</h2>
        <label className="opt-check">
          <input
            type="checkbox"
            checked={settings.widgetEnabled}
            onChange={(e) => patch({ widgetEnabled: e.target.checked })}
          />
          <span>Mostrar o widget flutuante nas páginas do Movidesk e do Jira</span>
        </label>
      </section>

      <section className="opt-card">
        <h2>Templates de comentário</h2>
        <p className="opt-muted">
          Textos fixos inseridos com um clique nos comentários do timer (popup e widget).
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
                  patch({ commentTemplates: settings.commentTemplates.filter((_, i) => i !== index) })
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="opt-btn"
          onClick={() => patch({ commentTemplates: [...settings.commentTemplates, ""] })}
        >
          + Adicionar template
        </button>
      </section>

      <section className="opt-card">
        <h2>Regras por domínio</h2>
        <p className="opt-muted">
          Quando a aba ativa casar com o padrão e o cronômetro estiver em outra categoria (ou
          parado), o Chrome mostra uma notificação com botão para iniciar a categoria certa em um
          clique. A troca nunca é automática — a decisão é sempre sua.
        </p>
        {user ? (
          <RulesEditor uid={user.uid} settings={settings} patch={patch} />
        ) : (
          <p className="opt-muted">Entre na conta para escolher as categorias das regras.</p>
        )}
      </section>
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
      {settings.domainRules.length > 0 ? (
        <div className="opt-rules-head">
          <span>Padrão de URL</span>
          <span>Categoria</span>
          <span>Notificar</span>
          <span>Repetir após (min)</span>
          <span />
        </div>
      ) : null}
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
                updateRule(rule.id, { cooldownMinutes: Math.max(1, Number(e.target.value) || 15) })
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
              ✕
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
        + Adicionar regra
      </button>
    </>
  );
}
