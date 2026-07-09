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
  ↑/↓ e números animados), totais por categoria, totais por dia, pontos por categoria,
  **tempo por área**, **tempo por task** (cada Jira/Movidesk trabalhada, com sessões e
  pontos), **mapa de calor semana × hora** (quando você trabalha), frequência de uso por
  dia/categoria e % de registros que geraram task — filtro por período unificado (hoje/
  7 dias/este mês/mês passado/personalizado). A exportação em PDF (Ctrl+P) inclui um
  **resumo executivo** em narrativa automática, pronto para apresentar à gestão.
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
- **Acesso individual**: uso pessoal, um único login por vez, sem tela de cadastro
  público — os usuários são criados manualmente no console do Firebase.

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

Não existe tela de cadastro público — os usuários são criados manualmente no console do
Firebase (Authentication → Users → Add user).

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
- `npm run lint` — ESLint
