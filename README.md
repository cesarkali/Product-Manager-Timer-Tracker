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

- **Cronômetro em tempo real**: inicia/para um timer vinculado a uma categoria de
  atividade, com indicador visível em toda a aplicação enquanto está rodando. O tempo
  decorrido é calculado a partir do horário do servidor, então sobrevive a um refresh de
  página. Trocar de categoria com o cronômetro rodando salva automaticamente o registro
  anterior (operação atômica — nunca perde tempo registrado).
- **Lançamento manual retroativo**: para registrar tempo gasto em algo que já aconteceu,
  sem precisar ter ligado o cronômetro. Data e horários usam seletores customizados
  (calendário e relógio próprios, ver abaixo), sempre exibindo dia/mês/**ano** por
  completo — importante na virada do ano, quando "02/07" sozinho vira ambíguo.
- **Categorias de ação totalmente customizáveis**:
  - CRUD completo (criar, renomear, arquivar/reativar, excluir).
  - **Ícone** e **cor** escolhidos livremente por categoria (paleta fixa de 8 cores,
    testada para daltonismo).
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
  Fibonacci: 1, 2, 3, 5, 8, 13, 21). Isso ajuda a medir não só o tempo gasto, mas o
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
- **Dashboard com evidências**: totais por categoria, totais por dia, total de story
  points, pontos por categoria, relação tempo × pontos, frequência de uso por dia/
  categoria e percentual de registros que geraram task, com filtro por período (hoje/7
  dias/30 dias/período customizado) — pensado para ser exportado (via impressão do
  dashboard) em PDF e apresentado à gestão.
- **Seletores de data/hora 100% customizados**: nada de `<input type="date">`/
  `type="time">` nativos — calendário (grade de dias) e seletor de hora/minuto/segundo
  (popover com 3 colunas roláveis por mouse, sem scrollbar visível) construídos do zero,
  reaproveitando o mesmo estilo visual do resto da aplicação, com boa legibilidade tanto
  no tema claro quanto no escuro.
- **Animações de transição** entre rotas/abas da aplicação.
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
