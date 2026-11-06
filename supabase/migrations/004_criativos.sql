-- Gestão de Grupos - Fase 3: Biblioteca de criativos
create table if not exists public.creatives_library (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  niche text,
  file_url text,
  drive_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.creatives_library enable row level security;
drop policy if exists "gestor full creatives" on public.creatives_library;
create policy "gestor full creatives" on public.creatives_library for all using (public.is_gestor()) with check (public.is_gestor());
drop policy if exists "cliente select creatives" on public.creatives_library;
create policy "cliente select creatives" on public.creatives_library for select using (client_id in (select my_client_ids()));
