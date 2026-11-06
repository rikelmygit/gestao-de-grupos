-- Gestão de Grupos - Fase 2: snapshots de grupos WhatsApp/Telegram
create table if not exists public.group_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  platform text not null check (platform in ('whatsapp','telegram')),
  snapshot_date date not null,
  member_count integer default 0,
  entries integer default 0,
  exits integer default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, platform, snapshot_date)
);
alter table public.group_snapshots enable row level security;
drop policy if exists "gestor full snapshots" on public.group_snapshots;
create policy "gestor full snapshots" on public.group_snapshots for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select snapshots" on public.group_snapshots;
create policy "cliente select snapshots" on public.group_snapshots for select using (client_id in (select my_client_ids()));
