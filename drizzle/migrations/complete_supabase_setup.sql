-- =========================================================================
-- COMPLETE SUPABASE SCHEMA & PERMISSIONS SETUP FOR YATRADHAM QUOTE STUDIO
-- Run this entire script in your Supabase SQL Editor (SQL Query tab).
-- It is idempotent and safe to run on brand new or existing projects.
-- =========================================================================

-- 1. App Role Enum
do $$ begin
  create type public.app_role as enum ('admin', 'editor', 'viewer');
exception
  when duplicate_object then null;
end $$;

-- 2. Core Tables
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  legacy_username text,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table if not exists public.documents (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  body jsonb not null,
  version integer not null,
  updated_at timestamptz not null default now(),
  updated_by text not null
);
grant select on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;

create table if not exists public.shares (
  token_hash text primary key,
  body jsonb not null,
  expires_at timestamptz not null,
  created_by text not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
grant all on public.shares to service_role;
alter table public.shares enable row level security;

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  detail text not null
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;

-- 3. Core Role Functions
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists(
    select 1 from public.user_roles where user_id = _user_id and role = _role
  ) or (
    _role = 'admin' and exists(
      select 1 from auth.users where id = _user_id and lower(email) = 'tanvi.d.yatradham@gmail.com'
    )
  );
$$;

create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public, auth as $$
  select case 
    when public.has_role(auth.uid(), 'admin') then 'admin'
    when public.has_role(auth.uid(), 'editor') then 'editor'
    when public.has_role(auth.uid(), 'viewer') then 'viewer'
  end
$$;

create or replace function public.actor_name()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select username from public.profiles where id = auth.uid()),
    (select email from auth.users where id = auth.uid()),
    'unknown'
  )
$$;

-- 4. Audit & Document Storage Functions
create or replace function public.write_audit(_action text, _detail text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in required.'; end if;
  insert into public.audit_log(actor, action, detail)
    values(public.actor_name(), _action, left(coalesce(_detail, ''), 250));
end $$;

create or replace function public.save_document(_doc jsonb, _version integer)
returns integer language plpgsql security definer set search_path = public as $$
declare _id text := _doc->>'id'; _old integer; _new integer;
begin
  if public.current_role_name() not in ('admin', 'editor') or public.current_role_name() is null then
    raise exception 'Editor or admin required.';
  end if;
  if _id is null or _id !~ '^[A-Za-z0-9_-]{1,100}$' then raise exception 'Invalid document ID.'; end if;
  if length(_doc::text) > 2000000 then raise exception 'Document too large.'; end if;
  
  select version into _old from public.documents where id = _id for update;
  if _old is not null and coalesce(_version, -1) <> _old then
    raise exception 'This cloud document changed. Load the latest version before saving.';
  end if;
  if _old is null and coalesce(_version, 0) <> 0 then
    raise exception 'Cloud version not found.';
  end if;
  
  _new := coalesce(_old, 0) + 1;
  insert into public.documents(id, body, version, updated_at, updated_by)
    values(_id, _doc, _new, now(), public.actor_name())
    on conflict(id) do update set
      body = excluded.body,
      version = excluded.version,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by;
      
  insert into public.audit_log(actor, action, detail)
    values(public.actor_name(), 'document.save', _id || ' v' || _new);
  return _new;
end $$;

-- 5. Share Links Functions
create extension if not exists pgcrypto with schema extensions;

create or replace function public.create_share(_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare _body jsonb; _token text; _exp timestamptz := now() + interval '7 days';
begin
  if public.current_role_name() is null or public.current_role_name() not in ('admin', 'editor') then
    raise exception 'Editor or admin required.';
  end if;
  select body into _body from public.documents where id = _id;
  if _body is null then raise exception 'Save the document to cloud first.'; end if;
  
  _token := translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');
  insert into public.shares(token_hash, body, expires_at, created_by)
    values(encode(extensions.digest(_token, 'sha256'), 'hex'), _body, _exp, public.actor_name());
  insert into public.audit_log(actor, action, detail)
    values(public.actor_name(), 'share.create', _id);
  return jsonb_build_object('path', '/s/' || _token, 'expires', extract(epoch from _exp)::bigint);
end $$;

create or replace function public.list_shares()
returns table(id text, expires bigint, created_by text, revoked boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admin required.'; end if;
  return query
    select substr(s.token_hash, 1, 12), extract(epoch from s.expires_at)::bigint, s.created_by, s.revoked
    from public.shares s order by s.expires_at desc limit 100;
end $$;

create or replace function public.revoke_share(_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admin required.'; end if;
  if _id !~ '^[0-9a-f]{12}$' then raise exception 'Invalid share id.'; end if;
  update public.shares set revoked = true where substr(token_hash, 1, 12) = _id;
  insert into public.audit_log(actor, action, detail)
    values(public.actor_name(), 'share.revoke', _id);
end $$;

create or replace function public.get_share(_token text)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  select body from public.shares
  where token_hash = encode(extensions.digest(_token, 'sha256'), 'hex')
    and expires_at > now()
    and not revoked
$$;

-- 6. Admin User Management & Bootstrap
create or replace function public.admin_grant_role(_email text, _role public.app_role)
returns void language plpgsql security definer set search_path = public, auth as $$
declare _target_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admin required.'; end if;
  select id into _target_id from auth.users where lower(email) = lower(trim(_email));
  if _target_id is null then raise exception 'No user found with email %', _email; end if;
  delete from public.user_roles where user_id = _target_id;
  insert into public.user_roles(user_id, role) values(_target_id, _role);
  insert into public.audit_log(actor, action, detail)
    values(public.actor_name(), 'user.role', _email || ' -> ' || _role);
end $$;

create or replace function public.claim_initial_admin()
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare
  _caller uuid := auth.uid();
  _caller_email text;
begin
  if _caller is null then raise exception 'Sign in required.'; end if;
  select lower(email) into _caller_email from auth.users where id = _caller;
  if not exists(select 1 from public.user_roles where role = 'admin')
     or _caller_email = 'tanvi.d.yatradham@gmail.com'
  then
    delete from public.user_roles where user_id = _caller;
    insert into public.user_roles(user_id, role) values(_caller, 'admin');
    insert into public.audit_log(actor, action, detail)
      values(public.actor_name(), 'bootstrap', 'Claimed admin role for ' || coalesce(_caller_email, _caller::text));
    return true;
  end if;
  return false;
end $$;

create or replace function public.admin_list_users()
returns table(user_id uuid, email text, username text, role text, created_at timestamptz)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admin required.'; end if;
  return query
    select u.id, u.email::text, coalesce(p.username, u.raw_user_meta_data->>'username', u.email)::text,
           r.role::text, u.created_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.user_roles r on r.user_id = u.id
    order by u.created_at desc limit 200;
end $$;

-- 7. Triggers for Automatic User Handling
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, username, legacy_username)
    values(new.id, coalesce(new.raw_user_meta_data->>'username', new.email), new.raw_app_meta_data->>'legacy_username')
    on conflict do nothing;
  if not exists(select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values(new.id, 'admin');
    insert into public.audit_log(actor, action, detail) values(coalesce(new.email, '?'), 'bootstrap', 'Initial admin created');
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_auto_confirm_user()
returns trigger language plpgsql security definer as $$
begin
  if new.email_confirmed_at is null then new.email_confirmed_at := now(); end if;
  if new.confirmed_at is null then new.confirmed_at := now(); end if;
  return new;
end $$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute function public.handle_auto_confirm_user();

-- 8. Policies
drop policy if exists "own roles or admin" on public.user_roles;
create policy "own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins manage user_roles" on public.user_roles;
create policy "admins manage user_roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "members read profiles" on public.profiles;
create policy "members read profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_role_name() is not null);

drop policy if exists "members read documents" on public.documents;
create policy "members read documents" on public.documents for select to authenticated
  using (public.current_role_name() is not null);

drop policy if exists "admins read audit" on public.audit_log;
create policy "admins read audit" on public.audit_log for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 9. Master Data Tables (States, Cities, Vehicles, Packages, Durations)
create table if not exists public.states (
  id serial primary key,
  name text not null,
  is_active boolean not null default true
);
create unique index if not exists states_name_uq on public.states (lower(name));

create table if not exists public.cities (
  id serial primary key,
  city_name text not null,
  state_id int not null references public.states(id),
  district text,
  aliases text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists cities_name_state_uq on public.cities (lower(city_name), state_id);

create table if not exists public.destinations (
  id serial primary key,
  city_id int not null references public.cities(id),
  destination_name text not null,
  destination_type text not null default 'pilgrimage' check (destination_type in ('pilgrimage', 'tourist', 'stay', 'other')),
  is_active boolean not null default true
);
create unique index if not exists destinations_uq on public.destinations (lower(destination_name), city_id);

create table if not exists public.vehicle_types (
  id serial primary key,
  vehicle_name text not null,
  category text not null check (category in ('car', 'suv', 'tempo', 'bus', 'other')),
  seating_capacity int check (seating_capacity is null or seating_capacity between 1 and 100),
  is_active boolean not null default true,
  display_order int not null default 100
);
create unique index if not exists vehicle_types_uq on public.vehicle_types (lower(vehicle_name));

create table if not exists public.package_names (
  id serial primary key,
  name text not null,
  state_name text,
  subcategory_id int,
  is_active boolean not null default true
);
create unique index if not exists package_names_uq on public.package_names (lower(name));

create table if not exists public.subcategories (
  id serial primary key,
  name text not null,
  package_name_id int references public.package_names(id),
  is_active boolean not null default true
);
create unique index if not exists subcategories_uq on public.subcategories (lower(name));

create table if not exists public.durations (
  id serial primary key,
  days int not null check (days between 1 and 60),
  nights int not null check (nights between 0 and 60),
  display_label text not null,
  is_active boolean not null default true
);
create unique index if not exists durations_uq on public.durations (days, nights);

-- Foreign key link
do $$ begin
  alter table public.package_names add constraint fk_pkg_subcategory foreign key (subcategory_id) references public.subcategories(id);
exception
  when duplicate_object then null;
end $$;

-- 10. Grants on Masters and Functions
do $$ declare t text; begin
  foreach t in array array['states', 'cities', 'destinations', 'vehicle_types', 'package_names', 'subcategories', 'durations'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "anyone reads masters" on public.%I', t);
    execute format('create policy "anyone reads masters" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "admins add masters" on public.%I', t);
    execute format('create policy "admins add masters" on public.%I for insert to authenticated with check (public.has_role(auth.uid(), ''admin''))', t);
    execute format('drop policy if exists "admins edit masters" on public.%I', t);
    execute format('create policy "admins edit masters" on public.%I for update to authenticated using (public.has_role(auth.uid(), ''admin'')) with check (public.has_role(auth.uid(), ''admin''))', t);
  end loop;
end $$;

revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.has_role(uuid, public.app_role),
  public.current_role_name(),
  public.actor_name(),
  public.write_audit(text, text),
  public.save_document(jsonb, integer),
  public.create_share(text),
  public.list_shares(),
  public.revoke_share(text),
  public.claim_initial_admin(),
  public.admin_grant_role(text, public.app_role),
  public.admin_list_users()
to authenticated;

grant execute on function public.get_share(text) to anon, authenticated;

-- 9. Auto-assign admin to designated organization admins if already registered
do $$
declare _tanvi_id uuid;
begin
  select id into _tanvi_id from auth.users where lower(email) = 'tanvi.d.yatradham@gmail.com';
  if _tanvi_id is not null then
    delete from public.user_roles where user_id = _tanvi_id;
    insert into public.user_roles(user_id, role) values(_tanvi_id, 'admin');
    insert into public.profiles(id, username) values(_tanvi_id, 'Tanvi')
      on conflict (id) do update set username = 'Tanvi';
  end if;
end $$;
