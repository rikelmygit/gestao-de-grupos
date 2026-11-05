# Gestão de Grupos

Plataforma SaaS para gestão de trágego pago para grupos de achadinhos (WhatsApp/Telegram). Interface dark, pt-BR, R$ e datas dd/MM/yyyy.

## Estrutura
- `src/pages/GestorDashboard.tsx` – visão consolidada do gestor
- `src/pages/Clientes.tsx` – CRUD completo
- `src/pages/ClienteDetalhe.tsx` – painel individual com 4 gráficos, CPL vs meta, campanhas e resumo
- `src/pages/Acessos.tsx` – criação de usuário e vínculo cliente↔usuário
- `src/pages/MetaIntegracao.tsx` – conexão real Meta Ads via Edge Function
- `supabase/migrations/001_initial.sql` – 9 tabelas + RLS (Lovable Cloud / Supabase)
- `supabase/functions/meta-ads/index.ts` – Graph API oficial, sem dados fictícios

## Rode local (sem Docker)
1. Instale dependências: `npm install` (usar `npm.cmd` no Windows se necessário)
2. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (após criar projeto no Lovable Cloud/Supabase)
3. Rode o SQL de `supabase/migrations/001_initial.sql` no SQL Editor do Lovable Cloud
4. Crie o 1º gestor: Auth → Sign Up → depois insira em `user_roles` com role `gestor`
5. `npm run dev`

## Meta Ads (real)
- Configurar segredo `META_ACCESS_TOKEN` (long-lived) em Lovable Cloud → Secrets (nunca no frontend)
- Edge Function `meta-ads` chama Graph API, calcula CPL e salva em `performance_metrics`/`campaigns`
- Sem token: a tela mostra “Integração pendente” – nenhuma conexão falsa

## Regras respeitadas
Sem clientes fictícios, sem métricas demo, sem localStorage como banco, sem integração falsa, RLS no backend.
