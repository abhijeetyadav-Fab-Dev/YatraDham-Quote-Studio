create type public.app_role as enum ('admin','editor','viewer');

create table public.user_roles(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  legacy_username text,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select case when public.has_role(auth.uid(),'admin') then 'admin'
              when public.has_role(auth.uid(),'editor') then 'editor'
              when public.has_role(auth.uid(),'viewer') then 'viewer' end
$$;

create policy "own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "members read profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_role_name() is not null);

create table public.documents(
  id text primary key check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  body jsonb not null,
  version integer not null,
  updated_at timestamptz not null default now(),
  updated_by text not null
);
grant select on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;
create policy "members read documents" on public.documents for select to authenticated
  using (public.current_role_name() is not null);

create table public.shares(
  token_hash text primary key,
  body jsonb not null,
  expires_at timestamptz not null,
  created_by text not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
grant all on public.shares to service_role;
alter table public.shares enable row level security;

create table public.audit_log(
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  detail text not null
);
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "admins read audit" on public.audit_log for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
grant select on public.audit_log to authenticated;

create or replace function public.actor_name() returns text language sql stable security definer set search_path=public as $$
  select coalesce((select username from public.profiles where id=auth.uid()), 'unknown')
$$;

create or replace function public.write_audit(_action text, _detail text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Sign in required.'; end if;
  if _action not in ('login','logout','grammar.request','email.send') then raise exception 'Invalid action'; end if;
  insert into public.audit_log(actor,action,detail) values(public.actor_name(), _action, left(coalesce(_detail,''),250));
end $$;

create or replace function public.save_document(_doc jsonb, _version integer)
returns integer language plpgsql security definer set search_path=public as $$
declare _id text := _doc->>'id'; _old integer; _new integer;
begin
  if public.current_role_name() not in ('admin','editor') or public.current_role_name() is null then raise exception 'Editor or admin required.'; end if;
  if _id is null or _id !~ '^[A-Za-z0-9_-]{1,100}$' then raise exception 'Invalid document.'; end if;
  if length(_doc::text) > 2000000 then raise exception 'Document too large.'; end if;
  select version into _old from public.documents where id=_id for update;
  if _old is not null and coalesce(_version,-1) <> _old then raise exception 'This cloud document changed. Load the latest version before saving.'; end if;
  if _old is null and coalesce(_version,0) <> 0 then raise exception 'Cloud version not found.'; end if;
  _new := coalesce(_old,0)+1;
  insert into public.documents(id,body,version,updated_at,updated_by) values(_id,_doc,_new,now(),public.actor_name())
    on conflict(id) do update set body=excluded.body, version=excluded.version, updated_at=excluded.updated_at, updated_by=excluded.updated_by;
  insert into public.audit_log(actor,action,detail) values(public.actor_name(),'document.save',_id||' v'||_new);
  return _new;
end $$;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.create_share(_id text)
returns jsonb language plpgsql security definer set search_path=public, extensions as $$
declare _body jsonb; _token text; _exp timestamptz := now() + interval '7 days';
begin
  if public.current_role_name() is null or public.current_role_name() not in ('admin','editor') then raise exception 'Editor or admin required.'; end if;
  select body into _body from public.documents where id=_id;
  if _body is null then raise exception 'Save the document to cloud first.'; end if;
  _token := translate(encode(extensions.gen_random_bytes(32),'base64'),'+/=','-_');
  insert into public.shares(token_hash,body,expires_at,created_by) values(encode(extensions.digest(_token,'sha256'),'hex'),_body,_exp,public.actor_name());
  insert into public.audit_log(actor,action,detail) values(public.actor_name(),'share.create',_id);
  return jsonb_build_object('path','/s/'||_token,'expires',extract(epoch from _exp)::bigint);
end $$;

create or replace function public.list_shares()
returns table(id text, expires bigint, created_by text, revoked boolean) language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin required.'; end if;
  return query select substr(s.token_hash,1,12), extract(epoch from s.expires_at)::bigint, s.created_by, s.revoked from public.shares s order by s.expires_at desc limit 100;
end $$;

create or replace function public.revoke_share(_id text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin required.'; end if;
  if _id !~ '^[0-9a-f]{12}$' then raise exception 'Invalid share id.'; end if;
  update public.shares set revoked=true where substr(token_hash,1,12)=_id;
  insert into public.audit_log(actor,action,detail) values(public.actor_name(),'share.revoke',_id);
end $$;

create or replace function public.get_share(_token text)
returns jsonb language sql stable security definer set search_path=public, extensions as $$
  select body from public.shares where token_hash=encode(extensions.digest(_token,'sha256'),'hex') and expires_at>now() and not revoked
$$;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.has_role(uuid,public.app_role), public.current_role_name(), public.actor_name(), public.write_audit(text,text), public.save_document(jsonb,integer), public.create_share(text), public.list_shares(), public.revoke_share(text) to authenticated;
grant execute on function public.get_share(text) to anon, authenticated;

-- Profile + first-user-becomes-admin bootstrap
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, username, legacy_username)
    values(new.id, coalesce(new.raw_user_meta_data->>'username', new.email), new.raw_app_meta_data->>'legacy_username')
    on conflict do nothing;
  if not exists(select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values(new.id,'admin');
    insert into public.audit_log(actor,action,detail) values(coalesce(new.email,'?'),'bootstrap','Initial admin created');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();