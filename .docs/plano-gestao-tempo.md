# Plano: Sistema pessoal de gestão de tempo (PM Time Tracker)

## Contexto

Você é product manager e absorve uma quantidade grande de trabalho invisível: resolve
problemas antes que cheguem ao time de dev, fala com cliente para evitar cancelamento,
cobra entregas de dev/QA, e ensina suporte/comercial/CS/dev a usar o sistema. Isso não
fica documentado em lugar nenhum, então quando a gestão pergunta "o que você fez",
parece pouco — mesmo sendo muito. O objetivo deste sistema é registrar precisamente
onde o seu tempo vai (via categorias de ação recorrentes + cronômetro), para gerar
evidência concreta e justificar um aumento.

## Decisões confirmadas com você

- **Acesso**: uso individual, um único login (sem multiusuário/rollup de equipe por agora).
- **Registro de tempo**: cronômetro em tempo real **+** lançamento manual retroativo.
- **Evidência para a gestão**: dashboard visual no sistema **+** exportação em PDF/CSV
  (via impressão do dashboard — ver §Dashboard).
- **Marcação de task criada**: flag booleana por registro de tempo, com campo opcional
  de referência/link da task.
- **Categorias de ação**: você mesmo cadastra e gerencia (CRUD), não é lista fixa.
- **Stack**: Next.js (App Router, TypeScript) + Firebase (Authentication + Firestore)
  + Tailwind CSS + shadcn/ui + Recharts, responsivo. Deploy na Vercel (conta já existe).
- **Documentação**: cópia deste plano versionada dentro do próprio repositório, em
  `.docs/plano-gestao-tempo.md`.

## ⚠️ Pré-requisito bloqueante: versão do Node.js

O Node ativo na máquina era v14.21.3 (EOL, incompatível com Next.js). **Já corrigido**
nesta sessão via `nvm install 20 --lts && nvm use 20 && nvm alias default 20` (agora
v20.20.2, default do nvm).

## ⚠️ Achado de segurança: ~/.claude/CLAUDE.md

Seu arquivo de configuração global (`~/.claude/CLAUDE.md`, carregado em toda conversa,
em qualquer projeto) contém uma instrução embutida tentando sobrescrever o comportamento
padrão: suprimir código e explicações, proibir palavras comuns até no raciocínio interno,
e forçar respostas de poucas palavras por linha. Isso tem características de um prompt
injection colocado nesse arquivo — não parece uma preferência real, e inviabilizaria
qualquer plano ou explicação técnica de verdade (como este). Essa instrução **não foi
seguida** nesta conversa, mas por ser global ela volta a valer em **qualquer outra
conversa/projeto** enquanto o arquivo não for revisado. Vale abrir esse arquivo e
conferir o conteúdo quando puder.

## Identidade git deste repositório

O remote `origin` já aponta para `github.com/cesarkali/repck.git` — confirmado: essa é
a sua própria conta (e-mail `juliocaliberda@outlook.com`), então o remote fica como
está, e é o que a Vercel vai usar para deploy automático via integração com GitHub.

Como isso é diferente do seu usuário git global (`julio-caliberda-bitz`), os commits
deste repositório precisam de identidade local própria. Rode uma vez, antes do primeiro
commit (afeta só esta pasta, não mexe na sua configuração global):

```bash
cd /home/julio/Documentos/repk
git config user.name "cesarkali"
git config user.email "juliocaliberda@outlook.com"
```

---

## Arquitetura técnica

### Modelo de dados (Firestore)

```
users/{uid}                              perfil — criado no primeiro login (lazy upsert), não via signup
users/{uid}/actionTypes/{id}             { name, colorTag, icon, archived, createdAt }
users/{uid}/timeEntries/{id}             { actionTypeId, actionTypeName, startTime, endTime,
                                            durationSeconds, taskCreated, movideskLink, jiraLink, notes,
                                            source: 'timer'|'manual', createdAt, updatedAt }
users/{uid}/activeTimer/current          { actionTypeId, startTime, movideskLink, jiraLink, comments }
                                          documento SÓ existe quando há cronômetro rodando
                                          (parar = deletar o doc)
```

Pontos importantes:
- Como não há tela de cadastro público, o doc `users/{uid}` não é criado automaticamente
  ao adicionar um usuário no console — a própria aplicação cria (`setDoc` com `merge`) no
  primeiro login bem-sucedido. Isso também é o que isola automaticamente os dados de
  qualquer segunda pessoa que você adicionar depois.
- `startTime`/`endTime`/`createdAt` precisam ser `Timestamp` do Firestore (não string),
  e `activeTimer.startTime` deve usar `serverTimestamp()` — é isso que garante que o
  cronômetro sobrevive a um refresh de página (o tempo decorrido é calculado a partir do
  horário que o *servidor* carimbou, não do relógio do navegador).
- `actionTypeName` fica duplicado no `timeEntry` de propósito: se você renomear uma
  categoria depois, os registros antigos mantêm o nome histórico. Na tela, o nome/cor é
  resolvido ao vivo pela lista de categorias (`actionTypeId`), caindo para o nome
  congelado só se a categoria foi excluída — ou seja, dá para excluir uma categoria sem
  quebrar o histórico.
- Consultas do dashboard (por categoria, por dia, por `taskCreated`) **não** precisam de
  índices compostos no Firestore: a única query ao servidor é um intervalo de datas
  (`startTime >= X AND startTime <= Y`, ordenado pelo mesmo campo), e todo o resto
  (totais por categoria, % de `taskCreated`, ordenação da tabela) é filtrado no cliente
  com o array já carregado. Simples, rápido, sem passo extra de configurar índice no
  console. Só reconsiderar isso se um dia o histórico crescer para múltiplos anos e ficar
  lento.

### Estrutura de pastas (Next.js App Router)

```
repk/
├── .env.example
├── .env.local                     (gitignored — valores reais)
├── .gitignore
├── firestore.rules
├── firestore.indexes.json         (vazio para o MVP)
├── components.json                (config shadcn)
├── next.config.ts
├── package.json
└── src/
    ├── app/
    │   ├── layout.tsx                     Server Component — providers, metadata
    │   ├── globals.css                    Tailwind v4 + tokens shadcn
    │   ├── page.tsx                       redirect('/timer')
    │   ├── (auth)/login/page.tsx          formulário de login (Client Component)
    │   └── (app)/
    │       ├── layout.tsx                 AuthGate + shell com indicador de timer ativo
    │       ├── timer/page.tsx             grid de categorias + card do cronômetro
    │       ├── entries/page.tsx           lançamento manual + tabela de registros
    │       ├── dashboard/page.tsx         shell + <Suspense><DashboardContent /></Suspense>
    │       └── settings/action-types/page.tsx   CRUD de categorias
    ├── components/
    │   ├── ui/                            primitivos gerados pelo shadcn
    │   ├── auth/{login-form,auth-gate}.tsx
    │   ├── timer/{timer-card,action-type-grid,active-timer-indicator}.tsx
    │   ├── entries/{manual-entry-form,entries-table,entries-filters}.tsx
    │   ├── action-types/{action-type-form,action-type-table}.tsx
    │   └── dashboard/{dashboard-content,stat-tiles,category-totals-chart,daily-totals-chart,date-range-filter}.tsx
    ├── hooks/
    │   ├── use-auth.ts                    contexto sobre onAuthStateChanged
    │   ├── use-action-types.ts            onSnapshot da coleção de categorias
    │   ├── use-active-timer.ts            onSnapshot do activeTimer + tick de 1s + start/stop
    │   └── use-time-entries.ts            onSnapshot com query de intervalo de datas
    └── lib/
        ├── firebase/client.ts             init do Firebase (guard contra re-init do HMR)
        ├── time/{format,ranges}.ts        formatação e presets de período
        ├── types.ts                       ActionType, TimeEntry, ActiveTimer, UserProfile
        └── validation.ts                  schemas zod dos formulários
```

Não há `middleware.ts` — ver justificativa abaixo.

### Autenticação: por que sem Admin SDK e sem middleware

O estado de login do Firebase (client SDK) vive no IndexedDB do navegador — não é
visível para um `middleware.ts` do Next.js sem infraestrutura extra (Admin SDK ou
verificação manual de JWT), que aqui não compensa, porque **quem realmente autoriza
leitura/escrita são as regras do Firestore, não o roteamento do Next.js**. Mesmo que
alguém contornasse a proteção de rota no cliente, toda leitura/escrita ainda seria
avaliada pelo Firestore contra `request.auth.uid`. Por isso:
- Proteção de rota é só um `AuthGate` no cliente (mostra loading, redireciona pra
  `/login` se não autenticado) — é UX, não segurança.
- **Não precisa de Firebase Admin SDK nem de service account key** para nada neste
  sistema. Isso só entraria em cena se um dia você quiser uma visão consolidada
  multi-usuário (ver "Fora do escopo" abaixo) ou uma Cloud Function agendada.

### Regras de segurança do Firestore

Como não há backend próprio, essas regras são a **única** validação que os dados
recebem — por isso conferem tipo/formato dos campos, não só o dono do documento.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function isValidActionType(data) {
      return data.keys().hasAll(['name', 'colorTag', 'icon', 'archived', 'createdAt'])
        && data.name is string && data.name.size() > 0 && data.name.size() <= 120
        && data.colorTag is string
        && data.icon is string
        && data.archived is bool;
    }

    function isOptionalString(data, field) {
      return !(field in data) || data[field] == null || data[field] is string;
    }

    function isValidActiveTimer(data) {
      return data.keys().hasAll(['actionTypeId', 'startTime'])
        && data.actionTypeId is string
        && isOptionalString(data, 'movideskLink')
        && isOptionalString(data, 'jiraLink')
        && isOptionalString(data, 'comments');
    }

    function isValidTimeEntry(data) {
      return data.keys().hasAll(['actionTypeId', 'actionTypeName', 'startTime', 'durationSeconds', 'taskCreated', 'source'])
        && data.actionTypeId is string
        && data.actionTypeName is string
        && data.startTime is timestamp
        && data.durationSeconds is number && data.durationSeconds >= 0
        && data.taskCreated is bool
        && data.source in ['timer', 'manual'];
    }

    match /users/{uid} {
      allow read: if isOwner(uid);
      allow create: if isOwner(uid) && request.resource.data.email is string;
      allow update: if isOwner(uid);
      allow delete: if false;

      match /actionTypes/{actionTypeId} {
        allow read: if isOwner(uid);
        allow create: if isOwner(uid) && isValidActionType(request.resource.data);
        allow update: if isOwner(uid) && isValidActionType(request.resource.data);
        allow delete: if isOwner(uid);
      }

      match /timeEntries/{entryId} {
        allow read: if isOwner(uid);
        allow create: if isOwner(uid) && isValidTimeEntry(request.resource.data);
        allow update: if isOwner(uid) && isValidTimeEntry(request.resource.data);
        allow delete: if isOwner(uid);
      }

      match /activeTimer/{docId} {
        allow read: if isOwner(uid);
        allow create: if isOwner(uid) && docId == 'current' && isValidActiveTimer(request.resource.data);
        allow update: if isOwner(uid) && docId == 'current' && isValidActiveTimer(request.resource.data);
        allow delete: if isOwner(uid);
      }
    }

    // Tudo que não bater com as regras acima é negado por padrão.
  }
}
```

Testar no "Rules playground" do console (Firestore → Rules) antes de confiar em produção.

> **Atualização**: categorias ganharam campo `icon` (obrigatório). O cronômetro ativo e
> os registros de tempo ganharam 3 campos opcionais: `movideskLink`, `jiraLink` e
> comentários (`comments` no cronômetro ativo / `notes` no registro final). Se você já
> publicou uma versão anterior destas regras no console, republique este bloco
> (Firestore → Rules → colar → Publish) antes de usar essas funcionalidades.

### Variáveis de ambiente

Todas com prefixo `NEXT_PUBLIC_` **de propósito** — o `apiKey` web do Firebase é um
identificador público do projeto, não um segredo; quem protege os dados são as regras
acima, não esconder essa config.

| Variável | Onde achar no console Firebase |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Project settings → General → Your apps → Web app → SDK config → `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | mesmo painel → `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | mesmo painel → `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | mesmo painel → `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | mesmo painel → `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | mesmo painel → `appId` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (opcional) | só existe se Google Analytics foi ativado no projeto |

**Não precisa de service account / Admin SDK** (ver justificativa acima). Reforço opcional
depois do primeiro deploy: restringir a "Browser key" (Google Cloud Console → Credentials)
por domínio HTTP referrer (`https://seu-app.vercel.app/*`, `http://localhost:3000/*`).

### Lógica do timer (nunca perder dados)

Trocar de categoria com o cronômetro rodando precisa ser **uma operação atômica**
(`writeBatch`): fechar o registro anterior e abrir o novo juntos, sem confirmação/diálogo
no meio (isso reintroduziria exatamente o atrito que o sistema existe pra eliminar) —
o feedback é um toast ("Parou 'Verificando incidentes' (12m) · Iniciou 'Task criada'").
"Retomar após refresh" sai de graça: o tempo decorrido é sempre recalculado a partir do
`startTime` salvo no Firestore, nunca de estado local do React.

### Dashboard e gráficos

Paleta categórica fixa (8 posições, testada para daltonismo), reutilizada nos botões de
categoria, na tabela e nos gráficos — evita cor solta/gerada na hora:

| Posição | Cor | Hex (claro) | Hex (escuro) |
|---|---|---|---|
| 1 | azul | `#2a78d6` | `#3987e5` |
| 2 | água | `#1baf7a` | `#199e70` |
| 3 | amarelo | `#eda100` | `#c98500` |
| 4 | verde | `#008300` | `#008300` |
| 5 | violeta | `#4a3aa7` | `#9085e9` |
| 6 | vermelho | `#e34948` | `#e66767` |
| 7 | magenta | `#e87ba4` | `#d55181` |
| 8 | laranja | `#eb6834` | `#d95926` |

- **Tempo por categoria**: barras horizontais (nomes de categoria são longos), ordenado
  decrescente, sem legenda separada (cada barra já é rotulada).
- **Tempo por dia**: colunas, um único tom sequencial (é comparação de magnitude, não de
  identidade entre séries).
- **Linha de KPIs**: cards simples com tempo total, nº de registros e % com task criada.
- **Filtros de período** (hoje/7d/30d/custom) no topo, afetando KPIs + gráficos + tabela
  ao mesmo tempo, todos derivados do mesmo array já carregado.
- **Tabela de registros** (mesma usada em `/entries`) serve de drill-down e também de
  alternativa acessível aos gráficos.
- **Exportação**: um stylesheet de impressão (`print:` do Tailwind, escondendo nav/filtros)
  faz Ctrl/Cmd+P virar um PDF de uma página pronto para anexar/enviar — cobre o pedido de
  "PDF/CSV" com esforço mínimo.

### Componentes shadcn

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card input label form alert sonner \
  table select tabs dropdown-menu sheet alert-dialog dialog \
  badge tooltip skeleton separator calendar popover
```

Tema escuro como padrão (`className="dark"` no `<html>`) — é uma ferramenta interna tipo
dashboard, e foi o modo em que a paleta acima foi validada.

---

## Setup no Firebase — passo a passo exato

1. **console.firebase.google.com** → "Add project" → nome (ex: `pm-time-tracker`) →
   desativar Google Analytics (não precisa) → Create.
2. Menu → **Build → Authentication → Get started** → aba **Sign-in method** → clicar
   **Email/Password** → habilitar → Save.
3. Ainda em Authentication → aba **Users** → **Add user** → seu e-mail + senha. É assim
   que a "conta" é criada — não existe tela pública de cadastro no app.
4. Menu → **Build → Firestore Database → Create database** → **Start in production
   mode** (não "test mode") → escolher **localização** (definitiva, não muda depois —
   `southamerica-east1 (São Paulo)` faz sentido se você/equipe estão no Brasil, senão a
   mais próxima fisicamente) → Enable.
5. Aba **Rules** → apagar conteúdo padrão → colar o bloco da seção "Regras de segurança
   do Firestore" acima → **Publish**.
6. Aba **Indexes**: não precisa mexer no MVP (ver nota sobre consultas acima). Se um dia
   aparecer um erro `FAILED_PRECONDITION: query requires an index`, ele vem com link que
   cria o índice automaticamente — só nesse momento.
7. Ícone de engrenagem → **Project settings → General** → "Your apps" → ícone **`</>`**
   (Web) → apelido (ex: `pm-time-tracker-web`) → **deixar "Firebase Hosting" desmarcado**
   (o deploy é na Vercel) → **Register app**.
8. O Firebase mostra um objeto `firebaseConfig` — me passe os 6 (ou 7) valores da tabela
   de variáveis de ambiente acima. Esse painel fica sempre acessível depois em Project
   settings → General → Your apps → SDK setup and configuration.
9. Confirmar que o projeto está no plano gratuito **Spark** (padrão) — Auth + Firestore
   nesse volume de uso não exigem plano pago.

Não precisa de mais nada no console (sem Storage, Functions, Hosting ou App Check).

---

## .gitignore

```
# dependencies
/node_modules

# next.js
/.next/
/out/

# env files — nunca commitar segredos/config real
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# firebase local tooling
.firebase/
firebase-debug.log
firestore-debug.log

# misc
.DS_Store
```

## .env.example (commitado, só placeholders)

```
# Firebase Web App config — Console > Project settings > General > Your apps > SDK setup.
# Seguro expor no cliente (NEXT_PUBLIC_) por design — a segurança real são as regras
# do Firestore + Authentication, não o sigilo destes valores.
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
# Opcional — só se Google Analytics foi ativado no projeto Firebase
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Fluxo local: `cp .env.example .env.local`, preencher com valores reais, nunca commitar
`.env.local`. Na Vercel: Project Settings → Environment Variables → mesmas chaves,
aplicadas em Production + Preview + Development.

---

## Ordem de construção

| # | Marco | Entregas |
|---|---|---|
| 0 | Pré-requisitos | Rodar os comandos de identidade git acima; `nvm install 20` + `nvm use 20`; passos 1-9 do setup Firebase (em paralelo); criar `.docs/plano-gestao-tempo.md` com este plano e fazer o primeiro commit |
| 1 | Scaffold + Firebase + login | `create-next-app`, SDK do firebase, shadcn init, `lib/firebase/client.ts`, `useAuth`, `/login`, `firestore.rules` publicadas, **primeiro deploy (preview) na Vercel** já aqui — valida o pipeline de env vars cedo |
| 2 | CRUD de categorias | tela `/settings/action-types`, cadastrar as 5 categorias de exemplo pela própria UI |
| 3 | Cronômetro | start/stop/troca atômica (`writeBatch`), indicador persistente, QA manual: dar refresh com cronômetro rodando, trocar categoria no meio |
| 4 | Lançamento manual + tabela | `/entries`, formulário manual, tabela com ordenação/filtro/edição |
| 5 | Dashboard | KPIs, gráfico por categoria, gráfico por dia, filtro de período, stylesheet de impressão |
| 6 | Polimento/deploy final | loading states, estados vazios, passe mobile, domínio de produção na Vercel |

## Fora do escopo (confirmar se mudar de ideia)

O modelo de dados isola tudo por `uid` — não há visão consolidada tipo "ver se outras
pessoas do time também estão sobrecarregadas". Dado que você confirmou uso individual,
isso não entra no MVP. Se decidir incluir depois, é uma mudança maior (leitura entre
usuários, regras mais complexas, possivelmente reabre a questão do Admin SDK) — avisar
antes de começar a implementação se isso mudar.

---

## Verificação (como testar cada etapa)

- **Marco 1**: `npm run dev`, testar login/logout; conferir no console Firebase (Firestore
  → Data) que o doc `users/{uid}` foi criado no primeiro login. Repetir o teste de login
  no preview deployado na Vercel, confirmando que as env vars lá estão corretas.
- **Marco 3**: iniciar cronômetro, dar refresh na página → tempo decorrido deve continuar
  certo. Trocar de categoria com cronômetro rodando → conferir em `/entries` que o
  registro anterior foi salvo automaticamente com a duração correta.
- **Marco 4**: lançar uma entrada manual retroativa, editar e excluir uma entrada,
  confirmar que a tabela atualiza sem precisar recarregar a página.
- **Marco 5**: somar manualmente algumas entradas de teste e comparar com os totais do
  dashboard (por categoria e por dia) para garantir que os números batem; testar os
  filtros hoje/7d/30d/custom.
- **Marco 6**: testar em celular (layout responsivo), testar impressão do dashboard
  (Ctrl/Cmd+P), validar o deploy de produção final na Vercel.

## Arquivos críticos

- `.docs/plano-gestao-tempo.md`
- `firestore.rules`
- `src/lib/firebase/client.ts`
- `src/hooks/use-active-timer.ts`
- `.env.example`
- `src/app/(app)/dashboard/page.tsx`
