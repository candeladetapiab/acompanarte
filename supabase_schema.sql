-- ======================================================
-- AcompañarTe — Schema de Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ======================================================

-- 1. TABLA PROFILES (extiende auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  nombre      text not null,
  apellido    text not null,
  rol         text not null check (rol in ('at', 'paciente')),
  avatar_url  text,
  obra_social text,           -- solo para pacientes
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Perfil propio" on public.profiles
  for all using (auth.uid() = id);

create policy "Lectura pública de perfiles" on public.profiles
  for select using (true);


-- 2. TABLA PERFILES_AT
create table public.perfiles_at (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  zona              text,
  honorarios        numeric(10,2),
  descripcion       text,
  obras_sociales    text[] default '{}',
  especialidades    text[] default '{}',
  activo            boolean default true,
  promedio_reseñas  numeric(3,2) default 0,
  created_at        timestamptz default now(),
  unique (profile_id)
);

alter table public.perfiles_at enable row level security;

create policy "AT edita su perfil" on public.perfiles_at
  for all using (auth.uid() = profile_id);

create policy "Lectura pública AT" on public.perfiles_at
  for select using (true);


-- 3. TABLA BUSQUEDAS
create table public.busquedas (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid not null references public.profiles(id) on delete cascade,
  descripcion  text not null,
  zona         text,
  obra_social  text,
  especialidad text,
  activa       boolean default true,
  created_at   timestamptz default now()
);

alter table public.busquedas enable row level security;

create policy "Paciente gestiona sus búsquedas" on public.busquedas
  for all using (auth.uid() = paciente_id);

create policy "Lectura pública de búsquedas activas" on public.busquedas
  for select using (activa = true);


-- 4. TABLA MENSAJES
create table public.mensajes (
  id          uuid primary key default gen_random_uuid(),
  de_id       uuid not null references public.profiles(id) on delete cascade,
  para_id     uuid not null references public.profiles(id) on delete cascade,
  contenido   text not null,
  leido       boolean default false,
  created_at  timestamptz default now()
);

alter table public.mensajes enable row level security;

create policy "Emisor puede enviar y ver sus mensajes" on public.mensajes
  for all using (auth.uid() = de_id);

create policy "Receptor puede ver sus mensajes" on public.mensajes
  for select using (auth.uid() = para_id);

create policy "Receptor puede marcar leído" on public.mensajes
  for update using (auth.uid() = para_id);


-- 5. TABLA RESEÑAS
create table public.reseñas (
  id          uuid primary key default gen_random_uuid(),
  at_id       uuid not null references public.profiles(id) on delete cascade,
  autor_id    uuid not null references public.profiles(id) on delete cascade,
  puntaje     int not null check (puntaje between 1 and 5),
  comentario  text,
  created_at  timestamptz default now(),
  unique (at_id, autor_id)
);

alter table public.reseñas enable row level security;

create policy "Paciente crea reseñas" on public.reseñas
  for insert with check (auth.uid() = autor_id);

create policy "Lectura pública de reseñas" on public.reseñas
  for select using (true);


-- 6. FUNCIÓN: actualizar promedio de reseñas automáticamente
create or replace function actualizar_promedio_reseñas()
returns trigger language plpgsql as $$
begin
  update public.perfiles_at
  set promedio_reseñas = (
    select coalesce(avg(puntaje), 0)
    from public.reseñas
    where at_id = new.at_id
  )
  where profile_id = new.at_id;
  return new;
end;
$$;

create trigger trg_actualizar_promedio
  after insert or update or delete on public.reseñas
  for each row execute function actualizar_promedio_reseñas();


-- 7. STORAGE: bucket para avatares
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Avatar público" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Usuario sube su avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "Usuario actualiza su avatar" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid() is not null);
