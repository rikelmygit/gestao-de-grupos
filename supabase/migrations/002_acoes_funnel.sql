-- Gestão de Grupos - Fase complementar (ações, funil manual, vendas, qualidade)
-- Seguro: cria tabelas apenas se não existirem, não remove dados existentes.

create table if not exists public.operation_actions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  action text not null,
  responsible text,
  deadline date,
  status text not null default 'pendente' check (status in ('pendente','em_andamento','concluida','pausada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_results (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  sales integer default 0,
  revenue numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, date)
);

create table if not exists public.lead_quality (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  valid_leads integer default 0,
  invalid_leads integer default 0,
  duplicate_leads integer default 0,
  retained_7d integer default 0,
  retained_30d integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, date)
);

-- RLS
alter table public.operation_actions enable row level security;
alter table public.sales_results enable row level security;
alter table public.lead_quality enable row level security;

drop policy if exists "gestor full actions" on public.operation_actions;
create policy "gestor full actions" on public.operation_actions for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select actions" on public.operation_actions;
create policy "cliente select actions" on public.operation_actions for select using (client_id in (select my_client_ids()));

drop policy if exists "gestor full sales" on public.sales_results;
create policy "gestor full sales" on public.sales_results for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select sales" on public.sales_results;
create policy "cliente select sales" on public.sales_results for select using (client_id in (select my_client_ids()));

drop policy if exists "gestor full quality" on public.lead_quality;
create policy "gestor full quality" on public.lead_quality for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select quality" on public.lead_quality;
create policy "cliente select quality" on public.lead_quality for select using (client_id in (select my_client_ids()));
