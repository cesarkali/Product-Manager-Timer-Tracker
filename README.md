# Gestão de Tempo

Sistema pessoal de gestão de tempo para product managers: cronômetro por categoria de
atividade, lançamento manual retroativo e dashboard com evidências de onde o tempo foi
gasto. Veja o plano completo em [`.docs/plano-gestao-tempo.md`](.docs/plano-gestao-tempo.md).

## Stack

Next.js (App Router, TypeScript) + Firebase (Authentication + Firestore) + Tailwind CSS
+ shadcn/ui + Recharts. Deploy na Vercel.

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
arquivo no console (Firestore → Rules) ou via Firebase CLI. Não é necessário configurar
índices compostos para o MVP (ver [`firestore.indexes.json`](firestore.indexes.json)).

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — roda o build de produção
- `npm run lint` — ESLint
