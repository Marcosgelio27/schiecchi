-- Base do Portal do Cliente SCHIECCHI. Execute no SQL Editor de um projeto Supabase.
-- Nenhuma senha, chave administrativa ou dado de telemetria é armazenado aqui.

create schema if not exists app;
revoke all on schema app from public, anon;
grant usage on schema app to authenticated;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (length(trim(legal_name)) between 2 and 180),
  responsible text,
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete restrict,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,40}$'),
  email text not null,
  full_name text,
  phone text,
  role text not null check (role in ('ADMINISTRADOR', 'CLIENTE')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_client_required check (role = 'ADMINISTRADOR' or client_id is not null)
);

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  identifier text not null check (length(trim(identifier)) between 1 and 120),
  manufacturer text,
  model text,
  serial_number text,
  equipment_type text,
  model_year integer check (model_year between 1900 and 2200),
  location_unit text,
  registration_status text not null default 'CADASTRADA' check (registration_status in ('CADASTRADA', 'INATIVA')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.telemetry_devices (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid unique references public.machines(id) on delete restrict,
  registration_status text not null default 'CADASTRADO' check (registration_status in ('CADASTRADO', 'ASSOCIADO', 'INATIVO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_status_matches_link check (
    (machine_id is null and registration_status <> 'ASSOCIADO')
    or (machine_id is not null and registration_status <> 'CADASTRADO')
  )
);

create index if not exists profiles_client_id_idx on public.profiles(client_id);
create index if not exists machines_client_id_idx on public.machines(client_id);
create index if not exists machines_serial_number_idx on public.machines(serial_number);
create index if not exists telemetry_devices_machine_id_idx on public.telemetry_devices(machine_id);

create or replace function app.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end; $$;

create trigger clients_updated_at before update on public.clients
for each row execute function app.touch_updated_at();
create trigger profiles_updated_at before update on public.profiles
for each row execute function app.touch_updated_at();
create trigger machines_updated_at before update on public.machines
for each row execute function app.touch_updated_at();
create trigger telemetry_devices_updated_at before update on public.telemetry_devices
for each row execute function app.touch_updated_at();

-- Helpers em schema não exposto à API. SECURITY DEFINER evita recursão na RLS de profiles.
create or replace function app.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'ADMINISTRADOR' and p.active
  );
$$;

create or replace function app.current_client_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.client_id from public.profiles p
  join public.clients c on c.id = p.client_id
  where p.id = (select auth.uid()) and p.role = 'CLIENTE' and p.active and c.active;
$$;

revoke all on function app.is_admin() from public, anon;
revoke all on function app.current_client_id() from public, anon;
grant execute on function app.is_admin() to authenticated;
grant execute on function app.current_client_id() to authenticated;

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.machines enable row level security;
alter table public.telemetry_devices enable row level security;

revoke all on public.clients, public.profiles, public.machines, public.telemetry_devices from public, anon, authenticated;
grant select, insert, update on public.clients, public.profiles, public.machines, public.telemetry_devices to authenticated;

create policy clients_read on public.clients for select to authenticated
using ((select app.is_admin()) or id = (select app.current_client_id()));
create policy clients_admin_insert on public.clients for insert to authenticated
with check ((select app.is_admin()));
create policy clients_admin_update on public.clients for update to authenticated
using ((select app.is_admin())) with check ((select app.is_admin()));

create policy profiles_read on public.profiles for select to authenticated
using ((select app.is_admin()) or (id = (select auth.uid()) and active));
create policy profiles_admin_insert on public.profiles for insert to authenticated
with check ((select app.is_admin()));
create policy profiles_admin_update on public.profiles for update to authenticated
using ((select app.is_admin())) with check ((select app.is_admin()));

create policy machines_read on public.machines for select to authenticated
using ((select app.is_admin()) or client_id = (select app.current_client_id()));
create policy machines_admin_insert on public.machines for insert to authenticated
with check ((select app.is_admin()));
create policy machines_admin_update on public.machines for update to authenticated
using ((select app.is_admin())) with check ((select app.is_admin()));

create policy devices_read on public.telemetry_devices for select to authenticated
using (
  (select app.is_admin()) or exists (
    select 1 from public.machines m
    where m.id = telemetry_devices.machine_id and m.client_id = (select app.current_client_id())
  )
);
create policy devices_admin_insert on public.telemetry_devices for insert to authenticated
with check ((select app.is_admin()));
create policy devices_admin_update on public.telemetry_devices for update to authenticated
using ((select app.is_admin())) with check ((select app.is_admin()));

-- A futura telemetry_data terá FK para machines/devices e RLS baseada no vínculo da máquina.
-- Dispositivos nunca utilizarão a chave administrativa do banco no equipamento.
