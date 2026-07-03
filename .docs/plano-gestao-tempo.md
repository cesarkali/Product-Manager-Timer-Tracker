# Plano: PMTT — Product Manager Time Tracker

## Contexto

Você é product manager e absorve uma quantidade grande de trabalho invisível: resolve
problemas antes que cheguem ao time de dev, fala com cliente para evitar cancelamento,
cobra entregas de dev/QA, e ensina suporte/comercial/CS/dev a usar o sistema. Isso não
fica documentado em lugar nenhum, então quando a gestão pergunta "o que você fez",
parece pouco — mesmo sendo muito. O objetivo deste sistema é registrar precisamente
onde o seu tempo vai (via categorias de ação recorrentes + cronômetro), medir também a
complexidade do trabalho (story points por task vinculada), e gerar evidência concreta
para justificar prioridades, carga de trabalho ou um aumento.

## Decisões confirmadas com você

- **Acesso**: uso individual, um único login (sem multiusuário/rollup de equipe por agora).
- **Registro de tempo**: cronômetro em tempo real **+** lançamento manual retroativo.
- **Evidência para a gestão**: dashboard visual no sistema **+** exportação em PDF (via
  impressão do dashboard — ver §Dashboard).
- **Marcação de task criada**: automática quando há task Jira vinculada (Movidesk sozinho
  não conta — é tratado como chamado de origem, não como a task de trabalho), mais um
  checkbox manual como reforço.
- **Complexidade**: story points (escala Fibonacci: 1, 2, 3, 5, 8, 13, 21) por task
  vinculada, não por registro — um registro pode ter várias tasks, cada uma com sua
  própria pontuação.
- **Categorias de ação**: você mesmo cadastra e gerencia (CRUD), com ícone, cor e ordem
  de exibição customizáveis; não é lista fixa do sistema.
- **Datas**: sempre com dia, mês **e ano** visíveis — nunca só "dd/mm", para não gerar
  ambiguidade na virada do ano.
- **Stack**: Next.js (App Router, TypeScript) + Firebase (Authentication + Firestore) +
  Tailwind CSS + shadcn/ui (`@base-ui/react`) + Recharts + react-hook-form + zod +
  date-fns, responsivo. Deploy na Vercel, domínio próprio `pmtt.caliberda.com.br`.
- **Nome do produto**: **PMTT** (Product Manager Time Tracker) — nome do projeto,
  pacote npm, título da aba do navegador, cabeçalho da aplicação e tela de login.
- **Seletores de data/hora**: componentes **customizados** construídos do zero (sem
  `<input type="date">`/`type="time">` nativos, sem lib de date-picker pronta),
  reaproveitando o estilo visual do calendário do dashboard.
- **Documentação**: cópia deste plano versionada dentro do próprio repositório, em
  `.docs/plano-gestao-tempo.md`, mantida atualizada a cada mudança relevante.

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

O remote `origin` aponta para `github.com/cesarkali/Product-Manager-Timer-Tracker` (o
repositório GitHub foi renomeado de `repck` para esse nome — o GitHub redireciona a URL
antiga automaticamente, mas o remote local já foi atualizado para a URL nova). Essa é a
sua própria conta, então é o que a Vercel usa para deploy automático via integração com
GitHub — se o deploy já estava conectado antes do rename, confira em Vercel → Project →
Settings → Git que a conexão continua apontando para o repositório certo (o GitHub avisa
a Vercel automaticamente na maioria dos casos, mas vale conferir).

Como isso pode ser diferente do seu usuário git global, os commits deste repositório
podem precisar de identidade local própria:

```bash
git config user.name "cesarkali"
git config user.email "juliocaliberda@outlook.com"
```

---

## Arquitetura técnica

### Modelo de dados (Firestore)

```
users/{uid}                              perfil — criado no primeiro login (lazy upsert), não via signup
                                          { email, name, role: 'pm', createdAt, hasSeededActionTypes? }
users/{uid}/actionTypes/{id}             { name, colorTag, icon, archived, order, createdAt }
users/{uid}/timeEntries/{id}             { actionTypeId, actionTypeName, startTime, endTime,
                                            durationSeconds, taskCreated, tasks: LinkedTask[], notes,
                                            source: 'timer'|'manual', createdAt, updatedAt }
users/{uid}/activeTimer/current          { actionTypeId, startTime, tasks: LinkedTask[], comments }
                                          documento SÓ existe quando há cronômetro rodando
                                          (parar = deletar o doc)
```

`LinkedTask` (não é subcoleção, é um array embutido no próprio documento):

```ts
interface LinkedTask {
  type: "jira" | "movidesk";
  reference: string;      // link ou identificador da task
  storyPoints: 1 | 2 | 3 | 5 | 8 | 13 | 21;   // escala Fibonacci
}
```

Um registro de tempo pode ter zero ou várias tasks vinculadas (botão "+" na UI); cada
task carrega sua própria pontuação — a complexidade é por task, não por registro.

`ActionType.order` (number) define a posição de exibição da categoria no grid do
cronômetro e na tabela de categorias — editável via drag-and-drop (ver §Categorias).

`hasSeededActionTypes` (em `users/{uid}`) existe só para o seed automático das categorias
padrão — ver §Bugs corrigidos para o histórico completo do problema e da correção.

Pontos importantes:
- Como não há tela de cadastro público, o doc `users/{uid}` não é criado automaticamente
  ao adicionar um usuário no console — a própria aplicação cria (`setDoc` com `merge`) no
  primeiro login bem-sucedido, e só nesse momento (não a cada reavaliação do estado de
  auth — ver §Bugs corrigidos). Isso também isola automaticamente os dados de qualquer
  segunda pessoa que você adicionar depois.
- `startTime`/`endTime`/`createdAt` precisam ser `Timestamp` do Firestore (não string),
  e `activeTimer.startTime` deve usar `serverTimestamp()` — é isso que garante que o
  cronômetro sobrevive a um refresh de página (o tempo decorrido é calculado a partir do
  horário que o *servidor* carimbou, não do relógio do navegador).
- `actionTypeName` fica duplicado no `timeEntry` de propósito: se você renomear ou
  excluir uma categoria depois, os registros antigos mantêm o nome histórico. Na tela, o
  nome/cor é resolvido ao vivo pela lista de categorias (`actionTypeId`), caindo para o
  nome congelado só se a categoria foi excluída — inclusive no `Select` de edição, que
  mostra explicitamente "(excluída)" e permite reatribuir o registro a outra categoria.
- Consultas do dashboard (por categoria, por dia, por `taskCreated`) **não** precisam de
  índices compostos no Firestore: a única query ao servidor é um intervalo de datas
  (`startTime >= X AND startTime <= Y`, ordenado pelo mesmo campo), e todo o resto
  (totais por categoria, % de `taskCreated`, ordenação da tabela) é filtrado no cliente
  com o array já carregado. Só reconsiderar isso se o histórico crescer para múltiplos
  anos e ficar lento.

### Estrutura de pastas (Next.js App Router)

```
repck/
├── vercel.json                    config de deploy (framework, comandos de build)
├── .env.example
├── .env.local                     (gitignored — valores reais)
├── .gitignore
├── firestore.rules
├── firestore.indexes.json         (vazio para o volume atual)
├── components.json                (config shadcn)
├── next.config.ts
├── package.json                   name: "pmtt"
└── src/
    ├── app/
    │   ├── layout.tsx                     Server Component — providers, metadata ("PMTT — Product Manager Time Tracker")
    │   ├── icon.svg                       favicon/app icon (convenção nativa do App Router)
    │   ├── globals.css                    Tailwind v4 + tokens shadcn (claro/escuro em OKLCH)
    │   ├── page.tsx                       redirect('/timer')
    │   ├── (auth)/login/page.tsx          formulário de login, cabeçalho "PMTT"
    │   └── (app)/
    │       ├── layout.tsx                 AuthGate + shell (Sidebar/MobileNav "PMTT") com indicador de timer ativo + transição entre rotas
    │       ├── timer/page.tsx             grid de categorias (ordenadas por ActionType.order) + card do cronômetro
    │       ├── entries/page.tsx           lançamento manual + tabela de registros + modal de edição
    │       ├── dashboard/page.tsx         shell + <Suspense><DashboardContent /></Suspense>
    │       └── settings/action-types/page.tsx   CRUD de categorias + botão de restaurar padrão
    ├── components/
    │   ├── ui/                            primitivos shadcn (base-ui/react), inclui textarea.tsx
    │   ├── auth/{login-form,auth-gate}.tsx
    │   ├── shared/
    │   │   ├── custom-day-picker.tsx      grade de calendário p/ seleção de dia único (sem lib pronta)
    │   │   ├── time-of-day-picker.tsx     popover com 3 colunas roláveis (hora/min/seg), sem lib pronta
    │   │   └── linked-tasks-editor.tsx    lista de LinkedTask com botão "+" e Select de tipo/story points
    │   ├── timer/{timer-card,action-type-grid,active-timer-indicator}.tsx
    │   ├── entries/
    │   │   ├── manual-entry-form.tsx      usa EntryFormFields
    │   │   ├── entry-form-fields.tsx      campos compartilhados entre criação e edição (RHF), grid de 12 colunas
    │   │   ├── edit-entry-dialog.tsx      modal de edição completa de um registro existente
    │   │   └── entries-table.tsx          tabela com coluna de comentário (tooltip + modal) e ação Editar
    │   ├── action-types/
    │   │   ├── action-type-form.tsx       criação de categoria (nome + ícone)
    │   │   ├── action-type-table.tsx      tabela com drag-and-drop de ordenação, troca de ícone/cor, renomear, arquivar, excluir
    │   │   ├── icon-picker.tsx            grade de ícones disponíveis
    │   │   └── color-picker.tsx           grade das 8 cores da paleta fixa
    │   └── dashboard/{dashboard-content,stat-tiles,category-totals-chart,category-points-chart,daily-totals-chart,category-frequency-table,date-range-filter,custom-calendar}.tsx
    ├── hooks/
    │   ├── use-auth.tsx                   contexto sobre onAuthStateChanged, upsert de perfil só na troca real de uid
    │   ├── use-action-types.ts            onSnapshot da coleção de categorias + seed idempotente + reorder/cor/ícone
    │   ├── use-active-timer.ts            onSnapshot do activeTimer + tick de 1s + start/stop (taskCreated automático se houver task Jira)
    │   └── use-time-entries.ts            onSnapshot com query de intervalo de datas + updateEntryFull
    └── lib/
        ├── firebase/client.ts             init do Firebase (guard contra re-init do HMR)
        ├── time/{format,ranges}.ts        formatação (sempre com ano) e presets de período
        ├── default-action-types.ts        lista das 13 categorias semeadas automaticamente
        ├── icons.tsx                      registro de ícones (lucide-react) usados pelas categorias
        ├── palette.ts                     paleta fixa de 8 cores (claro/escuro)
        ├── types.ts                       ActionType (com order), LinkedTask, TimeEntry, ActiveTimer, UserProfile, STORY_POINT_OPTIONS
        └── validation.ts                  schemas zod dos formulários (inclui linkedTaskSchema, manualEntrySchema)
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
- `upsertUserProfile` (grava o doc `users/{uid}`) só roda quando o `uid` muda de fato
  (login novo), não a cada reavaliação do listener `onAuthStateChanged` — evita
  competir por escrita com outros fluxos que também leem/escrevem `users/{uid}` (ver
  §Bugs corrigidos, caso da duplicação de categorias).

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
      return data.keys().hasAll(['name', 'colorTag', 'icon', 'archived', 'order', 'createdAt'])
        && data.name is string && data.name.size() > 0 && data.name.size() <= 120
        && data.colorTag is string
        && data.icon is string
        && data.archived is bool
        && data.order is number;
    }

    function isOptionalString(data, field) {
      return !(field in data) || data[field] == null || data[field] is string;
    }

    function isValidTasksField(data) {
      return !('tasks' in data) || data.tasks is list;
    }

    function isValidActiveTimer(data) {
      return data.keys().hasAll(['actionTypeId', 'startTime'])
        && data.actionTypeId is string
        && isValidTasksField(data)
        && isOptionalString(data, 'comments');
    }

    function isValidTimeEntry(data) {
      return data.keys().hasAll(['actionTypeId', 'actionTypeName', 'startTime', 'durationSeconds', 'taskCreated', 'source'])
        && data.actionTypeId is string
        && data.actionTypeName is string
        && data.startTime is timestamp
        && data.durationSeconds is number && data.durationSeconds >= 0
        && data.taskCreated is bool
        && data.source in ['timer', 'manual']
        && isValidTasksField(data);
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

> **⚠️ Republicar sempre que este bloco mudar.** Histórico de mudanças que exigiram
> republicar (Firestore → Rules → colar → Publish):
> 1. Categorias ganharam campo `icon` (obrigatório).
> 2. Cronômetro ativo e registros de tempo trocaram o antigo par `movideskLink`/
>    `jiraLink` por um campo único `tasks` (lista de `LinkedTask`), e ganharam
>    comentários (`comments` no cronômetro ativo / `notes` no registro final).
> 3. **Mais recente**: categorias ganharam campo `order` (number, obrigatório) para
>    suportar reordenação manual/drag-and-drop. Se você vir `Missing or insufficient
>    permissions` ao criar, editar, reordenar ou trocar cor/ícone de uma categoria,
>    confira se esta versão das regras já está publicada no console.

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
por domínio HTTP referrer (`https://pmtt.caliberda.com.br/*`, `http://localhost:3000/*`).

### Deploy — Vercel + domínio próprio

- `vercel.json` na raiz do projeto declara `framework: "nextjs"` e os comandos de
  build/dev/install — a Vercel detectaria isso automaticamente de qualquer forma, mas o
  arquivo deixa explícito e versionado.
- Domínio de produção: **`pmtt.caliberda.com.br`** — configurado em Vercel → Project →
  Settings → Domains, com o DNS (CNAME) apontado conforme instruído pela própria Vercel
  no momento de adicionar o domínio.
- Variáveis de ambiente (tabela acima) precisam ser configuradas em Vercel → Project →
  Settings → Environment Variables, replicadas em Production + Preview + Development.
- Identidade visual do deploy: nome do projeto na Vercel pode ser `pmtt` (o repositório
  GitHub é `Product-Manager-Timer-Tracker`).

### Lógica do timer (nunca perder dados)

Trocar de categoria com o cronômetro rodando é **uma operação atômica** (`writeBatch`):
fechar o registro anterior e abrir o novo juntos, sem confirmação/diálogo no meio (isso
reintroduziria exatamente o atrito que o sistema existe pra eliminar) — o feedback é um
toast ("Parou anterior (12m) · Iniciou 'Task criada'"). "Retomar após refresh" sai de
graça: o tempo decorrido é sempre recalculado a partir do `startTime` salvo no Firestore,
nunca de estado local do React.

Ao fechar um registro (troca de categoria ou "Parar"), `taskCreated` é calculado
automaticamente como `tasks.some(t => t.type === "jira")` — só uma task do tipo Jira
conta como "task criada"; Movidesk sozinho não marca (ver §Bugs corrigidos para o
histórico dessa regra).

### Dashboard e gráficos

Paleta categórica fixa (8 posições, testada para daltonismo), reutilizada nos botões de
categoria, na tabela e nos gráficos — evita cor solta/gerada na hora, e agora também é
escolhida manualmente por categoria via `ColorPicker`:

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
- **Pontos por categoria**: soma de story points das tasks vinculadas, agrupada por
  categoria — mede complexidade/esforço de análise, não só tempo.
- **Linha de KPIs**: cards com tempo total, nº de registros, % com task criada, total de
  story points e segundos por ponto (relação tempo × complexidade).
- **Frequência por dia/categoria**: tabela de quantas vezes cada categoria foi acionada no
  mesmo dia — evidencia rotinas que se repetem.
- **Filtros de período** (hoje/7d/30d/custom) no topo, afetando KPIs + gráficos + tabela
  ao mesmo tempo, todos derivados do mesmo array já carregado.
- **Tabela de registros** (mesma usada em `/entries`) serve de drill-down e também de
  alternativa acessível aos gráficos; coluna de comentário com preview truncado (tooltip
  limitado a 300 caracteres, com largura máxima real — ver §Bugs corrigidos #9) e
  abertura do modal de edição completa ao clicar.
- **Tooltips dos gráficos** usam as variáveis de tema (`--card`, `--card-foreground`) em
  vez de cor fixa, para permanecerem legíveis tanto no tema claro quanto no escuro.
- **Exportação**: um stylesheet de impressão (`print:` do Tailwind, escondendo nav/filtros)
  faz Ctrl/Cmd+P virar um PDF de uma página pronto para anexar/enviar.
- **Datas sempre com ano**: `formatDayLabel`/`formatDateTimeLabel` (`src/lib/time/
  format.ts`) incluem `year: "numeric"` — antes só mostravam dia/mês, o que ficaria
  ambíguo na virada do ano.

### Categorias: ícone, cor, ordem e drag-and-drop

- Cada categoria tem `icon` (chave de `ICON_REGISTRY`, `src/lib/icons.tsx`), `colorTag`
  (índice string na paleta de 8 cores) e `order` (posição de exibição).
- **Troca de ícone**: popover com `IconPicker` (grade de ícones), disparado ao clicar no
  ícone da categoria na tabela.
- **Troca de cor**: popover com `ColorPicker` (grade das 8 cores fixas), disparado ao
  clicar na bolinha de cor — cor não é mais amarrada ao índice de criação, é escolha
  livre.
- **Reordenação**: cada linha da tabela de categorias é arrastável (Drag and Drop API
  nativa do HTML5, sem lib externa) por uma alça (`GripVertical`) dedicada — o restante
  da linha (inputs, botões) continua clicável normalmente. Ao soltar sobre outra linha,
  a ordem completa é recalculada no cliente e gravada de uma vez via
  `reorderActionTypes(orderedIds)`, que grava `order: index` para cada categoria num
  único `writeBatch`. O grid do cronômetro (`ActionTypeGrid`) e a própria tabela exibem
  as categorias já ordenadas por `order` (com nome como desempate).
- **Restaurar categorias padrão**: botão em `/settings/action-types`, visível só quando
  não há nenhuma categoria cadastrada — cria as categorias padrão que ainda faltam
  (comparando por nome, sem duplicar), útil se a conta ficou sem categorias por causa do
  bug de seed descrito em §Bugs corrigidos.

### Categorias padrão (seed automático)

Semeadas automaticamente no primeiro login de uma conta sem nenhuma categoria
(`src/lib/default-action-types.ts`):

| # | Nome | Ícone | Cor |
|---|---|---|---|
| 1 | Criando task interna | clipboard-list | água |
| 2 | Desenvolvendo produtos | code | azul |
| 3 | Incidente retornado | rotate-ccw | água |
| 4 | Melhoria retornada | rotate-cw | vermelho |
| 5 | Testes exploratórios | flask-conical | água |
| 6 | Tirando dúvidas da Gestão | message-circle-question | violeta |
| 7 | Tirando dúvidas da implantação | rocket | violeta |
| 8 | Tirando dúvidas do CS | headset | vermelho |
| 9 | Tirando dúvidas do DEV | code | água |
| 10 | Tirando dúvidas do Financeiro | dollar-sign | água |
| 11 | Tirando dúvidas do suporte | headset | água |
| 12 | Verificando incidentes no Movidesk | bug | azul |
| 13 | Verificando melhorias no Movidesk | sparkles | vermelho |

Todas editáveis (nome, ícone, cor, ordem) ou removíveis depois pela própria UI.

### Seletores de data/hora e edição de registros

- **Nenhum `<input type="date">`/`type="time">` nativo** é usado — `CustomDayPicker`
  (grade de dias, reaproveitando o estilo do `CustomCalendar` do dashboard) e
  `TimeOfDayPicker` (popover com 3 colunas roláveis de hora/minuto/segundo) são
  construídos do zero com `date-fns` + os primitivos `Popover`/`Button` já existentes.
- `TimeOfDayPicker`: cada coluna esconde a scrollbar nativa (`scrollbar-width: none` +
  `::-webkit-scrollbar { display: none }`) mantendo o scroll por mouse; o item ativo é
  centralizado calculando `scrollTop` manualmente no container imediato (nunca usar
  `scrollIntoView` aqui — ele rola *todos* os ancestrais scrolláveis, incluindo o
  `DialogContent`, fazendo a tela toda "pular" quando o picker abre dentro de um modal).
- **Edição completa de registro** (`EditEntryDialog`): reaproveita os mesmos campos do
  formulário de criação (`EntryFormFields`, compartilhado via `react-hook-form`
  `control`/`watch`/`setValue`) — categoria, data, início/término, tasks vinculadas e
  comentário. Grid de 12 colunas (`lg:grid-cols-12`) com proporções ajustadas: Categoria
  4/12 (precisa de mais espaço para nomes longos), Data 3/12, Início 2/12 (só cabe
  "HH:mm:ss"), Término 3/12; Tasks/Comentários/checkbox ocupam a linha inteira.
- Recebe a lista **completa** de categorias (`actionTypes`, não só `activeActionTypes`),
  porque um registro antigo pode referenciar uma categoria já arquivada ou excluída — se
  receber só a lista ativa, o `Select` não encontra correspondência e cai no valor bruto
  (ID) em vez do nome.
- **`SelectValue` do `@base-ui/react` não resolve nome automaticamente**: ele exibe o
  valor bruto (o ID) a menos que se passe uma função `children` explícita
  `(value) => ReactNode` para formatar. `EntryFormFields` usa essa função para: mostrar
  `actionType.name` quando a categoria existe na lista, ou
  `${frozenActionTypeName} (excluída)` quando não existe mais — evita mostrar IDs crus
  de 20+ caracteres (que também quebravam o layout do campo).
- `updateEntryFull` (em `use-time-entries.ts`) recalcula `durationSeconds` a partir dos
  novos horários ao salvar uma edição.

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

1. **console.firebase.google.com** → "Add project" → nome (ex: `pmtt`) → desativar
   Google Analytics (não precisa) → Create.
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
6. Aba **Indexes**: não precisa mexer no volume atual. Se um dia aparecer um erro
   `FAILED_PRECONDITION: query requires an index`, ele vem com link que cria o índice
   automaticamente — só nesse momento.
7. Ícone de engrenagem → **Project settings → General** → "Your apps" → ícone **`</>`**
   (Web) → apelido (ex: `pmtt-web`) → **deixar "Firebase Hosting" desmarcado** (o deploy
   é na Vercel) → **Register app**.
8. O Firebase mostra um objeto `firebaseConfig` — use os 6 (ou 7) valores na tabela de
   variáveis de ambiente acima. Esse painel fica sempre acessível depois em Project
   settings → General → Your apps → SDK setup and configuration.
9. Confirmar que o projeto está no plano gratuito **Spark** (padrão) — Auth + Firestore
   nesse volume de uso não exigem plano pago.

Não precisa de mais nada no console (sem Storage, Functions, Hosting ou App Check).

---

## Bugs corrigidos (histórico)

Registrado para não repetir os mesmos diagnósticos no futuro.

1. **Seed de categorias duplicando 3x**: `seedDefaultActionTypes` rodava em corrida —
   múltiplos disparos do `onSnapshot` viam a coleção vazia antes da primeira escrita
   propagar, criando o mesmo lote de categorias mais de uma vez. Corrigido com uma trava
   (`hasSeededActionTypes` em `users/{uid}`, checada via `runTransaction`), mas
   **importante**: a trava só é marcada como concluída **depois** que o `batch.commit()`
   das categorias tiver sucesso — marcá-la antes (versão inicial da correção) deixava
   contas travadas permanentemente sem categorias caso o commit falhasse por qualquer
   motivo transitório.
2. **Corrida entre o seed e o upsert de perfil**: `upsertUserProfile` (em `use-auth.tsx`)
   fazia `setDoc(merge: true)` no doc `users/{uid}` a cada disparo do
   `onAuthStateChanged` (inclusive em navegações que não são login novo), colidindo com
   a transação do seed que lê/escreve o mesmo documento — a transação abortava por
   `failed-precondition`. Corrigido fazendo o upsert rodar só quando o `uid` muda de
   fato.
3. **`FirebaseError: Missing or insufficient permissions` ao editar categorias antigas**:
   não era problema das regras do Firestore — eram categorias duplicadas/corrompidas
   pelos dois bugs acima. Resolvido pela raiz (seed idempotente) mais limpeza manual dos
   dados afetados.
4. **Select de categoria mostrando ID em vez do nome** no modal de edição: o componente
   recebia só `activeActionTypes` (categorias não arquivadas); registros de categorias
   arquivadas/excluídas caíam no valor bruto. Corrigido passando a lista completa e
   formatando o valor exibido via função `children` do `SelectValue` (ver §Seletores).
5. **Tela "bugando" ao abrir o seletor de hora dentro do modal de edição**:
   `scrollIntoView({block: "center"})` rolava todos os containers ancestrais com
   overflow, incluindo o `DialogContent`, fazendo o modal pular de posição. Corrigido
   calculando `scrollTop` manualmente restrito ao container imediato.
6. **Scrollbar branca visível** no seletor de hora: escondida via CSS
   (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`), mantendo o
   scroll por mouse.
7. **Tooltips dos gráficos ilegíveis em tema escuro**: faltava `color`/`labelStyle`/
   `itemStyle` explícitos no `contentStyle` do Recharts. Corrigido usando as variáveis de
   tema (`--card`, `--card-foreground`).
8. **Selects menores que as opções**: o `SelectContent` do `@base-ui/react` forçava
   `w-(--anchor-width)` (largura igual ao trigger fechado), cortando textos maiores.
   Corrigido para `w-max min-w-(--anchor-width)`, e o `SelectTrigger`/`SelectValue`
   passaram a truncar com reticências (`truncate`) só quando o espaço é insuficiente,
   sem forçar o campo a crescer além do necessário.
9. **Tooltip de comentário "vazando" texto**: a causa raiz não era falta de
   `break-words` — o `TooltipContent` base usava `inline-flex w-fit`, que faz o elemento
   crescer para caber todo o conteúdo *antes* do `max-width` ter qualquer efeito (um
   `max-width` só limita o que já tentaria ser maior; um `w-fit` sem quebra já "decide"
   o tamanho primeiro). Corrigido trocando a base para `flex` simples (sem `w-fit`) com
   `max-w-[min(20rem,90vw)]` como teto real, e truncando o texto exibido em 300
   caracteres com aviso de "clique para ver o comentário completo".
10. **"Task criada" marcando mesmo só com Movidesk**: a regra inicial marcava
    `taskCreated: true` sempre que havia qualquer task vinculada. Corrigido para exigir
    especificamente uma task do tipo `jira` (Movidesk sozinho não conta).
11. **Datas sem ano**: `formatDayLabel`/`formatDateTimeLabel` mostravam só dia/mês.
    Corrigido adicionando `year: "numeric"` — relevante para não confundir registros de
    anos diferentes na mesma exibição.
12. **Erro "Select uncontrolled → controlled"**: o `Select` de categoria recebia
    `value={actionTypeId || undefined}` — como o valor inicial é string vazia (falsy), o
    componente nascia não controlado (`value={undefined}`) e virava controlado assim que
    uma categoria era escolhida. Corrigido com `value={actionTypeId ?? ""}`, mantendo
    sempre uma string desde o primeiro render.
13. **Sem contador/limite de caracteres em comentários**: o textarea permitia digitar
    além do limite de 1000 caracteres do schema zod, só rejeitando no submit sem avisar
    antes. Corrigido com `maxLength={1000}` + contador `X/1000` visível, tanto no
    formulário de registros quanto no textarea do cronômetro (que também teve o valor
    salvo no Firestore limitado via `.slice(0, 1000)` como reforço, já que não passa
    pelo schema zod).
14. **Cronômetro sem milissegundos e sem exibir horas fixas**: adicionado
    `formatClockWithMillis` (centésimos, não milissegundos — 3 dígitos desalinhava o
    layout) só no card grande do timer, sempre no formato `HH:MM:SS.CC` (nunca omitindo
    horas) para o layout não mudar de tamanho em tarefas longas. Atualização via
    `requestAnimationFrame` escrevendo direto no `textContent` do DOM, sem `setState` a
    cada frame — evita re-renderizar a árvore inteira dezenas de vezes por segundo. O
    indicador compacto (sidebar/menu mobile) continua só em segundos.

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

## Fora do escopo (confirmar se mudar de ideia)

O modelo de dados isola tudo por `uid` — não há visão consolidada tipo "ver se outras
pessoas do time também estão sobrecarregadas". Dado que você confirmou uso individual,
isso não entra no escopo atual. Se decidir incluir depois, é uma mudança maior (leitura
entre usuários, regras mais complexas, possivelmente reabre a questão do Admin SDK) —
avisar antes de começar a implementação se isso mudar.

---

## Verificação (checklist geral)

- **Login/perfil**: `npm run dev`, testar login/logout; conferir no console Firebase
  (Firestore → Data) que o doc `users/{uid}` foi criado no primeiro login e não é
  regravado a cada navegação.
- **Categorias**: criar, renomear, trocar ícone, trocar cor, arquivar/reativar, excluir,
  reordenar por drag-and-drop — conferir que a ordem persiste após recarregar a página e
  que o grid do cronômetro reflete a nova ordem.
- **Cronômetro**: iniciar, dar refresh na página → tempo decorrido deve continuar certo.
  Trocar de categoria com cronômetro rodando → conferir em `/entries` que o registro
  anterior foi salvo automaticamente com a duração correta. Vincular uma task Jira e
  confirmar que "Task criada" fica "Sim"; vincular só Movidesk e confirmar que continua
  "Não".
- **Lançamento manual + edição**: lançar uma entrada retroativa usando os seletores
  customizados de data/hora (conferir que a data mostra o ano), editar um registro
  completo (inclusive trocando a categoria de um registro com categoria excluída),
  excluir uma entrada — tudo sem precisar recarregar a página.
- **Dashboard**: somar manualmente algumas entradas de teste e comparar com os totais do
  dashboard (por categoria, por dia, por story points) para garantir que os números
  batem; testar os filtros hoje/7d/30d/custom; testar impressão (Ctrl/Cmd+P).
- **Responsividade**: testar em viewport estreito (~375px) o formulário manual, o modal
  de edição e a tela de categorias.
- **Deploy**: validar login e todas as funcionalidades acima no domínio de produção
  `pmtt.caliberda.com.br`, com as variáveis de ambiente configuradas na Vercel.

## Arquivos críticos

- `.docs/plano-gestao-tempo.md`
- `firestore.rules`
- `vercel.json`
- `src/lib/firebase/client.ts`
- `src/hooks/use-auth.tsx`
- `src/hooks/use-action-types.ts`
- `src/hooks/use-active-timer.ts`
- `.env.example`
- `src/app/(app)/dashboard/page.tsx`
