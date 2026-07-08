# Evolução PMTT — Página do dia, descrição rápida, lembretes, áreas, dashboard e polish

## Contexto

O PMTT registra tempo, mas hoje é pouco prático no uso diário: descrever o que se está fazendo depende do textarea de comentários; quando se esquece de ligar o cronômetro, o lançamento manual é trabalhoso; o dashboard tem poucos indicadores para apresentar à gestão; e o visual carece de fluidez/animação. O objetivo é transformar o app em algo que dê vontade de usar e que gere evidência forte do trabalho invisível (para autoconhecimento e para pleitear aumento).

**Decisões confirmadas com o usuário:**
- `/timer` vira a "página do dia" (resumo de hoje + timeline com lacunas clicáveis).
- Lembretes: aviso no app + Notification API do navegador.
- Categorias ganham campo opcional "área" + gráfico de distribuição por área.
- Dashboard ganha: comparação com período anterior, tabela tempo-por-task, heatmap semana×hora, resumo executivo imprimível.

## Princípios de segurança de dados (inegociáveis)

1. **Todo campo novo é opcional/aditivo.** Nada entra nos `hasAll` das rules; nunca usar `hasOnly`. As rules atuais já aceitam campos extras (verificado: só `hasAll` + helpers `isOptional*`), então app novo + rules antigas não quebra, e vice-versa. Rollback trivial.
2. **Nenhuma migração/regravação em massa.** Docs existentes nunca são tocados; agregados novos são derivados em leitura com `?? fallback`.
3. **Firestore rejeita `undefined`** → todo campo novo coalesce para `null`.
4. **Preferências em `users/{uid}` sempre via `updateDoc` com patch** (preserva `hasSeededActionTypes`/`sidebarCollapsed`).
5. Publicar as rules novas no console (Firestore → Rules → Publish) **antes** do deploy do app; testar no Rules Playground.

---

## Fase 0 — Fundações (modelo de dados + rules)

**`firestore.rules`** — só ADICIONAR cláusulas (nunca mexer nos `hasAll`):
- `isValidActionType`: `&& isOptionalString(data, 'area')`
- `isValidActiveTimer`: `&& isOptionalString(data, 'description')`
- `isValidTimeEntry`: `&& isOptionalString(data, 'description')`
- Preferências de lembrete vivem em `users/{uid}` (update já é livre pelo dono) — zero mudança de rules.

**`src/lib/types.ts`**: `DESCRIPTION_MAX_LENGTH = 140`; `ActionType.area?: string | null`; `TimeEntry.description?: string | null`; `ActiveTimer.description?: string | null`; `UserProfile` ganha `reminderEnabled?`, `reminderMinutes?`, `workStart?`, `workEnd?`, `workDays?: number[]`.

**Novo `src/lib/areas.ts`**: `AREA_OPTIONS = ["Suporte","Desenvolvimento","CS","Gestão","Financeiro","Implantação","Produto","Outro"]` + `areaColor()` (índice → `CATEGORY_PALETTE[i].dark`; null → cor cinza de `DELETED_CATEGORY_COLOR`).

**`src/lib/validation.ts`**: `manualEntrySchema` ganha `description: z.string().max(140).optional()`.

**`.docs/plano-gestao-tempo.md`**: atualizar modelo de dados + item 7 no histórico de rules.

✅ `npm run build` — app atual funciona intocado.

## Fase 1 — Descrição rápida (dor nº 1)

- **`src/hooks/use-active-timer.ts`**: `ActiveTimerFields` ganha `description: string | null`; `updateActiveTimerFields` trata `"description" in patch` (trim + `.slice(0, 140)` + null se vazio, igual a `comments`); `startTimer`/`stopTimer` gravam `description: activeTimer.description ?? null` no entry fechado; novo activeTimer nasce com `description: null`.
- **`src/hooks/use-time-entries.ts`**: `ManualEntryData.description?`; `addManualEntry`/`updateEntryFull` gravam `description` normalizada (`null` se vazia).
- **Novo `src/components/timer/quick-description-input.tsx`**: `Input` proeminente (primeiro campo sob o relógio), placeholder "O que você está fazendo?", `maxLength=140`, contador; persiste **onBlur + Enter** (mesmo padrão do textarea de comentários). Abaixo, chips (`Badge outline` clicáveis) com sugestões.
- **Novo `src/lib/description-suggestions.ts`**: `recentDescriptions(entries, actionTypeId, max=5)` — filtra por categoria, dedupe case-insensitive, últimas 5 distintas. Alimentado pelos entries de 7 dias já assinados na página do timer (Fase 2) — sem query/coleção nova.
- **`src/components/timer/timer-card.tsx`**: prop `suggestions`; estado `descriptionValue` resetado no mesmo bloco "ajustar estado durante o render" existente (linhas 84-91).
- **`src/components/entries/entry-form-fields.tsx`** + `manual-entry-form.tsx` + `edit-entry-dialog.tsx`: campo "Descrição (opcional)" acima das tasks vinculadas; defaults/values com `entry.description ?? ""`.
- **`src/components/entries/entries-table.tsx`**: coluna "Comentário" vira "Descrição": `description` como linha principal (`font-medium`), `notes` como secundária truncada (tooltip/modal atuais mantidos). Registros antigos mostram só notes, como hoje.

✅ Build + manual: timer com descrição → doc no console; parar → entry com description; **editar registro antigo e salvar → sem erro de permissão**; chips aparecem ao repetir categoria.

## Fase 2 — Página do dia + ajuste retroativo do início

- **`src/app/(app)/timer/page.tsx`**: assina **7 dias** (`useTimeEntries(rangeForPreset("7d"))` memoizado) — alimenta timeline (filtro de hoje via `toLocalIsoDate`) e sugestões de descrição. Layout: header "Hoje" + `DaySummary` → `TimerCard` → `DayTimeline` → `ActionTypeGrid` → `ManualEntryDialog` (lacunas).
- **Novo `src/lib/time/day-timeline.ts`** (função pura): `buildDayTimeline({entries, activeTimer, workStart, workEnd, now, minGapMs=5min})` → blocos `entry|active|gap`, eixo arredondado para hora cheia (do min(workStart, primeiro registro) ao max(workEnd, último, agora)), lacunas ≥5min dentro de `[workStart, min(agora, workEnd)]`, com merge de sobreposições.
- **Novo `src/components/timer/day-timeline.tsx`**: faixa `relative h-14`, blocos `absolute` posicionados em %, cor `categoryColor`, tooltip (categoria · horários · descrição); bloco ativo com pulse; gap = botão tracejado com `Plus` no hover e `aria-label`; ticks de hora.
- **Novo `src/components/timer/day-summary.tsx`**: linha compacta "Xh Ym hoje · N registros" (soma `durationSeconds` + `elapsedSeconds` do timer).
- **Novo `src/components/entries/manual-entry-dialog.tsx`**: `Dialog` largo (mesmas classes do `EditEntryDialog`) envolvendo `ManualEntryForm` com `key={initialValues?.startTime}`; **`manual-entry-form.tsx`** ganha props `defaultValues?: Partial<...>` e `onSuccess?`. Clique na lacuna pré-preenche data/início/fim.
- **`use-active-timer.ts`** — nova `adjustStartTime(newStart: Date): Promise<boolean>`: recusa futuro e `>= pausedAt`; `updateDoc` só de `startTime`. **Novo `src/components/timer/start-time-adjuster.tsx`**: "Iniciado às HH:mm:ss · ajustar" → Popover com chips −5/−10/−15/−30min + `TimeOfDayPicker` existente; erro → toast.

✅ Build + manual: lacunas clicáveis salvam certo; ajustar início −10min → relógio salta; futuro recusado; refresh preserva tudo.

## Fase 3 — Configurações + lembretes

- `npx shadcn@latest add switch` (único primitivo novo).
- **Novo `src/hooks/use-user-preferences.ts`**: onSnapshot em `users/{uid}` + `updatePreferences(patch)` via `updateDoc`; defaults `{enabled:false, 15min, "08:00"–"18:00", seg–sex}`. (Padrão de `use-sidebar-preference.ts`; não refatorar o da sidebar agora.)
- **Nova rota `/settings`** (`page.tsx` com Suspense + **novo `src/components/settings/settings-content.tsx`**): `Tabs` Categorias | Preferências sincronizadas com `?tab=`. Extrair corpo de `settings/action-types/page.tsx` para **novo `src/components/action-types/action-types-panel.tsx`**; rota antiga vira `redirect("/settings?tab=categorias")`.
- **Novo `src/components/settings/preferences-panel.tsx`**: Switch (ao ativar → `Notification.requestPermission()` + mostrar estado), Select intervalo (10–60min), horário de expediente (gravar "HH:mm"), toggles de dias da semana; texto explicando que aba fechada = sem notificação (Web Push fica como evolução futura).
- **Novo `src/hooks/use-timer-reminder.ts`** + **`src/components/app-shell/timer-reminder.tsx`** (client, `return null`) montado no layout `(app)`: ociosidade desde a transição do timer para null (no mount, `getDocs(orderBy startTime desc, limit 1)` → `endTime`); `setInterval` 60s checa enabled + dia/horário útil + sem timer + idle ≥ X + throttle (ref + `sessionStorage`); dispara `toast.warning` com ação "Ir para Hoje" e, se permissão concedida e aba oculta, `new Notification` com foco no click. Timer pausado conta como "rodando" (não lembra).
- **Nav** (`sidebar-nav-links.tsx`): `/settings` "Configurações" (ícone `Settings`); `/timer` vira rótulo "Hoje" (URL mantida).
- `DayTimeline` passa a usar `workStart`/`workEnd` das prefs.

✅ Build + manual: salvar prefs → conferir no console que `hasSeededActionTypes`/`sidebarCollapsed` continuam no doc; lembrete dispara com aba em background; não dispara fora do expediente.

## Fase 4 — Áreas

- **`use-action-types.ts`**: `setActionTypeArea(id, area: string | null)` (padrão de `setActionTypeColor`).
- **`action-type-table.tsx`**: coluna "Área" com Select compacto ("Sem área" + `AREA_OPTIONS` fixas).
- **Novo `src/components/dashboard/area-totals-chart.tsx`**: barras horizontais (mesmo padrão do `CategoryTotalsChart`, com % no label) — não donut, por consistência. Agregação em `dashboard-content.tsx`: `actionTypesById.get(id)?.area ?? "Sem área"`.
- **`stat-tiles.tsx`**: 6º tile "Área principal" (`nome · X%`); grid `xl:grid-cols-6`.

✅ Build + manual: atribuir áreas; "Sem área" agrupa categorias sem valor e excluídas.

## Fase 5 — Dashboard avançado

- **`src/lib/time/ranges.ts`**: `previousRange(range)` (período imediatamente anterior de mesma duração) + preset `"lastMonth"`.
- **Comparação**: segunda assinatura `useTimeEntries(previousRange(range))` em `dashboard-content.tsx` (reusa o hook; custo irrelevante). `stat-tiles.tsx` ganha prop `previous?` e linha de delta `↑/↓ ±X%` (verde p/ tempo/registros/pontos; neutro p/ % task e tempo-por-ponto; "—" sem base).
- **Novo `src/components/dashboard/task-time-table.tsx`**: agrega `entry.tasks` por `reference.trim().toLowerCase()` → tempo total (atribuição integral por entry, nota de rodapé explicando), sessões, SP (max), tipo, link externo. Incluída no print.
- **Novo `src/components/dashboard/week-hour-heatmap.tsx`**: **grid CSS próprio** (não Recharts). Matriz 7×24 distribuindo duração por fronteiras de hora (via `endTime`); células `color-mix` tom único escalado pelo max; `title` nativo como tooltip; colunas limitadas à faixa com dados; `print:hidden`.
- **Novo `src/components/dashboard/executive-summary.tsx`**: `buildExecutiveSummary(...)` → 2-4 frases condicionais (total, delta, top categoria/área, tasks distintas, pontos); seção `hidden print:block` após o cabeçalho de impressão.
- **Presets unificados** (dashboard + entries): `Hoje · 7 dias · Este mês · Mês passado · Personalizado`; URL continua aceitando `30d`/`month` (back-compat).

✅ Build + manual: deltas conferidos com conta manual; Ctrl+P → resumo presente, heatmap ausente, 1 página ok.

## Fase 6 — Animações/polish + navegação

**Abordagem: CSS-first, sem lib `motion`** — `tw-animate-css` já cobre entradas; count-up é hook pequeno; evita 2 sistemas de animação e ~35kb.

- **Novo `src/hooks/use-count-up.ts`**: rAF + easeOutCubic; respeita `prefers-reduced-motion`. Usado nos `StatTiles` e `DaySummary`.
- **`globals.css`**: `@keyframes timer-glow` pulsando **opacity** da div de gradiente já existente no TimerCard (só quando rodando, não pausado); e obrigatório:
  ```css
  @media print { *, *::before, *::after { animation: none !important; transition: none !important; } }
  @media (prefers-reduced-motion: reduce) { * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
  ```
  (sem isso, stagger com `fill-mode-backwards` imprime cards invisíveis).
- **Stagger de entrada**: `animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards` + `animationDelay: index*40ms` (máx ~400ms) no `ActionTypeGrid`, `StatTiles` e cards do dashboard.
- **Micro-interações**: `active:scale-[0.98]` nos cards de categoria; hovers nos chips/gaps.
- **Novo `src/components/app-shell/page-header.tsx`** (`{title, description?, actions?}`) usado nas 4 rotas.

✅ Build + manual: print limpo; sem jank com timer rodando; reduced-motion respeitado.

---

## Verificação final (fim de cada fase + geral)

- `npm run build` a cada fase; app sempre funcional entre fases (commits separados).
- Fluxo completo com dados reais: iniciar/pausar/ajustar início/trocar categoria/parar → conferir registros; editar **registro antigo** (pré-description) e salvar sem erro; lacuna → lançamento; lembrete em background; dashboard vs contas manuais; impressão.
- Conferir no console Firestore que docs antigos permanecem intactos e `users/{uid}` mantém os campos existentes.
- Atualizar `.docs/plano-gestao-tempo.md` e `README.md` ao final.

## Inventário de escritas novas (por que nenhuma afeta dados existentes)

| Escrita | Onde | Segurança |
|---|---|---|
| `updateDoc(activeTimer, {description})` | onBlur do input | doc efêmero; campo opcional |
| `batch.set(timeEntries/{novo}, {...description})` | start/stopTimer | doc **novo** |
| `addDoc(timeEntries, {...description})` | lançamento manual | doc novo |
| `updateDoc(timeEntries/{id}, {...description: x ?? null})` | edição explícita pelo usuário | só o doc aberto; `null` é aditivo; nunca `undefined` |
| `updateDoc(actionTypes/{id}, {area})` | Select de área | campo único, ação explícita |
| `updateDoc(users/{uid}, {reminder*, work*})` | painel de preferências | patch via `updateDoc`, preserva campos existentes |
| `updateDoc(activeTimer, {startTime})` | ajuste retroativo | doc efêmero; validação client (não-futuro, < pausedAt) |

Sem índice composto novo (todas as queries continuam em campo único `startTime`). Rules antigas já aceitam os campos novos → deploy e rollback seguros em qualquer ordem (ainda assim: rules primeiro).
