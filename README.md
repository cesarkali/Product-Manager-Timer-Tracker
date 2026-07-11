# PMTT — Product Manager Time Tracker

Sistema pessoal de gestão de tempo, pensado para product managers e outras funções que
absorvem muito trabalho invisível — resolver problemas antes que cheguem ao time de dev,
falar com cliente para evitar cancelamento, cobrar entregas de dev/QA, ensinar
suporte/comercial/CS a usar o sistema, etc. Esse tipo de trabalho raramente fica
documentado em algum lugar, então quando a gestão pergunta "o que você fez", parece
pouco — mesmo sendo muito.

O objetivo do projeto é registrar com precisão onde o tempo é gasto, por categoria de
atividade, e transformar isso em evidência concreta (dashboard visual + exportação) para
justificar prioridades, carga de trabalho ou pedidos como um aumento.

## O que o sistema faz

- **Página do dia ("Hoje")**: a tela do cronômetro é a home prática do dia — resumo de
  hoje (tempo total + nº de registros), **linha do dia** com blocos coloridos por
  categoria e **lacunas clicáveis** (clicou numa lacuna sem registro → abre o lançamento
  manual já pré-preenchido com os horários certos), além do grid de categorias.
- **Descrição rápida ("O que você está fazendo?")**: campo curto e proeminente no
  cronômetro (até 140 caracteres, separado dos comentários longos), com **chips das
  descrições recentes da mesma categoria** — 1 clique preenche e salva. A descrição vira
  a linha principal na tabela de registros e também existe no lançamento manual/edição.
- **Cronômetro em tempo real**: inicia/para um timer vinculado a uma categoria de
  atividade, com indicador visível em toda a aplicação enquanto está rodando. O tempo
  decorrido é calculado a partir do horário do servidor, então sobrevive a um refresh de
  página. Trocar de categoria com o cronômetro rodando salva automaticamente o registro
  anterior (operação atômica — nunca perde tempo registrado). Atalhos de teclado 1-9
  iniciam a categoria configurada direto.
- **Ajuste retroativo do início**: esqueceu de ligar o cronômetro na hora? "Iniciado às
  HH:mm:ss · ajustar" corrige o início do timer em andamento (chips −5/−10/−15/−30 min
  ou horário exato), sem nunca aceitar horário no futuro.
- **Lembrete "cadê o cronômetro?"**: dentro do expediente configurado (Configurações →
  Preferências), se nenhum timer estiver rodando pelo tempo escolhido, o app avisa com
  um toast e — se você permitir — uma notificação do navegador (funciona com a aba em
  segundo plano; aba fechada não notifica).
- **Pausar/retomar o cronômetro**: para quando você precisa atender outra coisa sem
  encerrar o registro em andamento. O relógio congela durante a pausa (indicador "Pausado"
  visível no card e na barra lateral) e o tempo pausado é descontado do total ao retomar
  ou ao finalizar o registro — nunca é contado como tempo trabalhado. Esse tempo pausado
  fica visível e editável (ou zerável) no modal de edição do registro, caso precise
  ajustar manualmente.
- **Lançamento manual retroativo**: para registrar tempo gasto em algo que já aconteceu,
  sem precisar ter ligado o cronômetro. Data e horários usam seletores customizados
  (calendário e relógio próprios, ver abaixo), sempre exibindo dia/mês/**ano** por
  completo — importante na virada do ano, quando "02/07" sozinho vira ambíguo.
- **Categorias de ação totalmente customizáveis**:
  - CRUD completo (criar, renomear, arquivar/reativar, excluir).
  - **Ícone** e **cor** escolhidos livremente por categoria (paleta fixa de 8 cores,
    testada para daltonismo).
  - **Área de negócio** opcional por categoria (Suporte, Desenvolvimento, CS, Gestão,
    Financeiro, Implantação, Produto, Outro) — agrupa o tempo por área atendida no
    dashboard: "X% do meu tempo vai para destravar o suporte".
  - **Atalho de teclado** (1-9) opcional por categoria para iniciar direto no cronômetro.
  - **Ordem de exibição** no grid do cronômetro é definida por você — arraste as linhas
    pela alça na tela de Categorias para reordenar (drag-and-drop nativo, sem lib
    externa).
  - Vêm 13 categorias padrão pré-cadastradas no primeiro login (rotina de suporte
    interno/PM: incidentes, melhorias, dúvidas de gestão/CS/DEV/financeiro/implantação/
    suporte, testes exploratórios, tasks internas, desenvolvimento de produtos) — todas
    editáveis ou removíveis depois.
  - Excluir uma categoria não apaga o histórico: registros antigos continuam mostrando o
    nome congelado da categoria (em cinza, com aviso de "excluída").
- **Tasks vinculadas com pontuação de complexidade**: cada registro de tempo pode ter uma
  ou mais tasks vinculadas (Jira e/ou Movidesk — botão "+" para adicionar quantas forem
  necessárias), cada uma com sua própria pontuação de complexidade (story points, escala
  Fibonacci: 0, 1, 2, 3, 5, 8, 13, 21 — **0 é o valor padrão**, para tickets que não
  precisam de pontuação). Isso ajuda a medir não só o tempo gasto, mas o
  esforço de análise/investigação por trás dele.
- **"Task criada" automática e inteligente**: o registro é marcado como tendo gerado uma
  task formal automaticamente quando há ao menos uma task vinculada do tipo **Jira**
  (não conta só ter um link do Movidesk, que normalmente é o chamado de origem, não a
  task de trabalho em si). Pode também ser marcado manualmente.
- **Comentários por registro**: campo de texto livre por lançamento, visível tanto na
  tela de Registros quanto no Dashboard (antes só era salvo, nunca mostrado), com modal
  dedicado para ler/editar comentários longos sem truncamento.
- **Edição completa de registros**: qualquer lançamento (do cronômetro ou manual) pode
  ser editado depois — categoria, data, horários, tasks vinculadas e comentário —, útil
  para corrigir um lançamento feito errado. Mesmo um registro cuja categoria já foi
  excluída pode ser reatribuído a uma categoria válida.
- **Dashboard com evidências**: KPIs com **comparação vs período anterior** (deltas
  ↑/↓ e números animados), totais por categoria, **composição de cada dia por área**
  (barras empilhadas — com jornada fixa o total diário não informa, a composição sim),
  pontos por categoria, **tempo por área**, **tempo por task** (cada Jira/Movidesk
  trabalhada, com sessões e pontos), **mapa de calor semana × hora** + **ritmo de
  trabalho** (dia mais produtivo, pico, dia típico, manhã×tarde×noite), frequência de
  uso por dia/categoria e % de registros que geraram task — filtro por período unificado
  (hoje/7 dias/este mês/mês passado/personalizado) e listas grandes **minimizáveis**.
  A exportação em PDF (Ctrl+P) inclui um **resumo executivo** em narrativa automática,
  pronto para apresentar à gestão.
- **Configurações → Preferências**: lembrete de cronômetro parado (intervalo, expediente
  e dias úteis configuráveis) — o expediente também define as lacunas da linha do dia.
- **Seletores de data/hora 100% customizados**: nada de `<input type="date">`/
  `type="time">` nativos — calendário (grade de dias) e seletor de hora/minuto/segundo
  (popover com 3 colunas roláveis por mouse, sem scrollbar visível) construídos do zero,
  reaproveitando o mesmo estilo visual do resto da aplicação, com boa legibilidade tanto
  no tema claro quanto no escuro.
- **Animações e fluidez**: transição entre rotas, entrada escalonada dos cards, números
  dos KPIs animados, glow pulsante no cronômetro rodando — tudo CSS-first (sem lib de
  animação JS), desligado automaticamente na impressão e para quem prefere menos
  movimento (`prefers-reduced-motion`).
- **Contas abertas**: cadastro por e-mail/senha ou Google direto na tela de login, com
  recuperação de senha. No primeiro acesso, um **tour guiado** (balões apontando cada
  função na tela) apresenta o sistema e recolhe o aceite dos **Termos de Uso e
  Privacidade** (checkbox obrigatório; termos legíveis sem sair do fluxo e em
  `/privacidade`). O tour pode ser refeito em Configurações → Preferências.
- **Novidades de versão**: botão "Novidades" na sidebar com badge pulsante quando há
  versão nova (`src/lib/changelog.ts` guarda o histórico; subir `APP_VERSION` +
  adicionar entrada no topo mostra o aviso a todos).
- **Temas e layout**: 11 temas completos (fundo, cards, sidebar e destaques —
  incluindo Meia-noite e dois temas claros), densidade (confortável/compacto) e raio
  dos cantos (reto/padrão/redondo), tudo por dispositivo em Configurações →
  Preferências → Aparência.
- **Atividade e restauração**: página "Atividade" no menu registra criações, edições e
  exclusões de registros/categorias/áreas; exclusões guardam o snapshot do documento e
  podem ser **restauradas com o mesmo id** (registros antigos voltam a resolver a
  categoria).
- **Tasks genéricas**: além de Jira e Movidesk, o tipo "Link" vincula tasks de qualquer
  ferramenta ao registro.
- **Zona de perigo**: exclusão da própria conta com confirmação dupla (digitar EXCLUIR +
  reautenticação), apagando todos os dados do usuário; o e-mail entra em cooldown de
  24h antes de poder criar conta nova.

## Extensão do Chrome

O PMTT Timer também existe como extensão
([Chrome Web Store](https://chromewebstore.google.com/detail/honniaakfdobdmepkhoobbamggpbconf)):
cronômetro no ícone do navegador (badge com o tempo decorrido), popup com categorias e
atalhos 1–9, captura de ticket/issue pela URL da aba ativa, sugestões de categoria por
domínio (notificações educadas, com cooldown e "silenciar por hoje") e os mesmos temas
do app. O código vive em [`extension/`](extension/INSTALL.md); `npm run ext:build` gera
o pacote em `extension/dist`, e `node extension/scripts/make-screenshots.mjs` gera as
artes da loja. O botão de instalação também aparece no app em Configurações →
Preferências.

## Stack

Next.js (App Router, TypeScript) + Firebase (Authentication + Firestore) + Tailwind CSS
+ shadcn/ui (`@base-ui/react`) + Recharts + react-hook-form + zod + date-fns. Deploy na
Vercel, servido em `pmtt.caliberda.com.br`.

A autorização de leitura/escrita é feita pelas regras de segurança do Firestore (não por
middleware do Next.js) — cada usuário só acessa os próprios dados, isolados por `uid`.

Veja o plano completo, com decisões de arquitetura, modelo de dados e histórico de bugs
corrigidos, em [`.docs/plano-gestao-tempo.md`](.docs/plano-gestao-tempo.md).

## Rodando localmente

1. Node.js 20+ (use `nvm use 20` se tiver o nvm instalado).
2. Instalar dependências:
   ```bash
   npm install
   ```
3. Configurar as variáveis de ambiente — copie o arquivo de exemplo e preencha com os
   valores do seu projeto Firebase (Console → Project settings → General → Your apps →
   SDK setup and configuration; passo a passo completo no plano):
   ```bash
   cp .env.example .env.local
   ```
4. Subir o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Abrir [http://localhost:3000](http://localhost:3000).

O cadastro é aberto na própria tela de login (e-mail/senha ou Google). Para o login
Google funcionar, habilite o provedor **Google** em Authentication → Sign-in method no
console do Firebase.

## Firestore

As regras de segurança estão em [`firestore.rules`](firestore.rules) — publique esse
arquivo no console (Firestore → Rules → colar → Publish) ou via Firebase CLI **sempre
que o arquivo mudar** (o histórico de mudanças está documentado no plano). Não é
necessário configurar índices compostos para o volume de uso atual (ver
[`firestore.indexes.json`](firestore.indexes.json)).

## Deploy (Vercel)

O projeto está configurado para deploy na Vercel via [`vercel.json`](vercel.json), com
domínio próprio `pmtt.caliberda.com.br`. Ao importar o repositório na Vercel:

1. Framework detectado automaticamente como Next.js.
2. Configurar as mesmas variáveis de ambiente do `.env.example` em Project Settings →
   Environment Variables (Production + Preview + Development).
3. Settings → Domains → adicionar `pmtt.caliberda.com.br` e apontar o DNS (CNAME) para a
   Vercel conforme instruído na própria tela.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — roda o build de produção
- `npm run ext:build` — build da extensão do Chrome em `extension/dist`
- `npm run ext:watch` — rebuild automático da extensão ao salvar
- `node extension/scripts/make-screenshots.mjs` — artes da Chrome Web Store (1280×800)
- `npm run lint` — ESLint
