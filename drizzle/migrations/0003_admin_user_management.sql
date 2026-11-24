-- 0. Ensure prerequisite app_role enum and user_roles table exist
do $$ begin
  create type public.app_role as enum ('admin','editor','viewer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_roles(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create or replace function public.actor_name() returns text language sql stable security definer set search_path=public as $$
  select coalesce((select username from public.profiles where id=auth.uid()), (select email from auth.users where id=auth.uid()), 'unknown')
$$;

create table if not exists public.audit_log(
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  detail text not null
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;

-- 1. Helper function for admin to grant/change user role
create or replace function public.admin_grant_role(_email text, _role public.app_role)
returns void language plpgsql security definer set search_path = public, auth as $$
declare _target_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Admin required.';
  end if;
  select id into _target_id from auth.users where lower(email) = lower(trim(_email));
  if _target_id is null then
    raise exception 'No user found with email %', _email;
  end if;
  delete from public.user_roles where user_id = _target_id;
  insert into public.user_roles(user_id, role) values(_target_id, _role);
  insert into public.audit_log(actor, action, detail)
    values(public.actor_name(), 'user.role', _email || ' -> ' || _role);
end $$;

-- 2. Helper function to claim initial admin (bootstrap)
create or replace function public.claim_initial_admin()
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare _caller uuid := auth.uid();
begin
  if _caller is null then raise exception 'Sign in required.'; end if;
  if not exists(select 1 from public.user_roles where role = 'admin') then
    delete from public.user_roles where user_id = _caller;
    insert into public.user_roles(user_id, role) values(_caller, 'admin');
    insert into public.audit_log(actor, action, detail)
      values(public.actor_name(), 'bootstrap', 'Claimed initial admin role');
    return true;
  end if;
  return false;
end $$;

-- 3. Helper function for admin to list team users
create or replace function public.admin_list_users()
returns table(user_id uuid, email text, username text, role text, created_at timestamptz)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Admin required.';
  end if;
  return query
    select u.id, u.email::text, coalesce(p.username, u.raw_user_meta_data->>'username', u.email)::text,
           r.role::text, u.created_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.user_roles r on r.user_id = u.id
    order by u.created_at desc limit 200;
end $$;

-- 4. Auto-confirm new users trigger to prevent "Email not confirmed" lockout
create or replace function public.handle_auto_confirm_user()
returns trigger language plpgsql security definer as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  if new.confirmed_at is null then
    new.confirmed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute function public.handle_auto_confirm_user();

-- 5. Policies & permissions
grant execute on function public.admin_grant_role(text, public.app_role), public.claim_initial_admin(), public.admin_list_users() to authenticated;

-- Allow admins to manage user_roles table directly
drop policy if exists "admins manage user_roles" on public.user_roles;
create policy "admins manage user_roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant all on public.user_roles to authenticated;
