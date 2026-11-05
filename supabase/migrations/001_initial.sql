-- Gestão de Grupos - Schema inicial (Lovable Cloud / Supabase)
-- Evitar duplicação: tabelas criadas apenas se não existirem.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nome_negocio text not null,
  nome_responsavel text,
  telefone text,
  email text,
  nicho text,
  status text not null default 'ativo' check (status in ('ativo','pausado','desativado','pendente')),
  orcamento_diario numeric,
  meta_cpl numeric,
  ad_account_id text,
  resumo_operacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('gestor','cliente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, user_id)
);

create table if not exists public.ad_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  external_id text not null,
  name text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  external_id text not null,
  name text not null,
  status text,
  spend numeric default 0, leads integer default 0, cpl numeric,
  impressions bigint default 0, reach bigint default 0, clicks bigint default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_sets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_external_id text,
  external_id text not null,
  name text not null,
  status text,
  spend numeric default 0, leads integer default 0, cpl numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  adset_external_id text,
  external_id text not null,
  name text not null,
  creative_id text,
  spend numeric default 0, leads integer default 0, cpl numeric,
  impressions bigint default 0, clicks bigint default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  spend numeric default 0,
  leads integer default 0,
  cpl numeric,
  impressions bigint default 0,
  reach bigint default 0,
  clicks bigint default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, date)
);

create table if not exists public.operation_summaries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.clients enable row level security;
alter table public.user_roles enable row level security;
alter table public.client_users enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.campaigns enable row level security;
alter table public.ad_sets enable row level security;
alter table public.ads enable row level security;
alter table public.performance_metrics enable row level security;
alter table public.operation_summaries enable row level security;

-- Helpers
create or replace function public.is_gestor() returns boolean language sql stable as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid() and role = 'gestor');
$$;

create or replace function public.my_client_ids() returns setof uuid language sql stable as $$
  select client_id from public.client_users where user_id = auth.uid() and is_active = true;
$$;

drop policy if exists "gestor full" on public.clients;
create policy "gestor full" on public.clients for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select own" on public.clients;
create policy "cliente select own" on public.clients for select using (id in (select my_client_ids()));

drop policy if exists "gestor full roles" on public.user_roles;
create policy "gestor full roles" on public.user_roles for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "self select roles" on public.user_roles;
create policy "self select roles" on public.user_roles for select using (user_id = auth.uid());

drop policy if exists "gestor full links" on public.client_users;
create policy "gestor full links" on public.client_users for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "self select links" on public.client_users;
create policy "self select links" on public.client_users for select using (user_id = auth.uid());

drop policy if exists "gestor full metrics" on public.performance_metrics;
create policy "gestor full metrics" on public.performance_metrics for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select metrics" on public.performance_metrics;
create policy "cliente select metrics" on public.performance_metrics for select using (client_id in (select my_client_ids()));

drop policy if exists "gestor full summary" on public.operation_summaries;
create policy "gestor full summary" on public.operation_summaries for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select summary" on public.operation_summaries;
create policy "cliente select summary" on public.operation_summaries for select using (client_id in (select my_client_ids()));

drop policy if exists "gestor full campaigns" on public.campaigns;
create policy "gestor full campaigns" on public.campaigns for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select campaigns" on public.campaigns;
create policy "cliente select campaigns" on public.campaigns for select using (client_id in (select my_client_ids()));

drop policy if exists "gestor full adsets" on public.ad_accounts;
create policy "gestor full adsets" on public.ad_accounts for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select adsets" on public.ad_accounts;
create policy "cliente select adsets" on public.ad_accounts for select using (client_id in (select my_client_ids()));

drop policy if exists "gestor full ads" on public.ads;
create policy "gestor full ads" on public.ads for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select ads" on public.ads;
create policy "cliente select ads" on public.ads for select using (client_id in (select my_client_ids()));

drop policy if exists "gestor full ad_sets" on public.ad_sets;
create policy "gestor full ad_sets" on public.ad_sets for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select ad_sets" on public.ad_sets;
create policy "cliente select ad_sets" on public.ad_sets for select using (client_id in (select my_client_ids()));

create or replace function public.handle_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_clients_upd on public.clients;
create trigger trg_clients_upd before update on public.clients for each row execute function public.handle_updated_at();
