-- ============================================================================
-- DACOMP UFU — perfis, papéis e auditoria
--
-- Aplicar com `supabase db push` (CLI autenticado) ou no SQL Editor.
-- O cadastro público fica desabilitado em supabase/config.toml; contas são
-- criadas por administradores através das Edge Functions.
-- ============================================================================

create type public.app_role as enum ('admin', 'membro');

-- ----------------------------------------------------------------------------
-- Perfis
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  matricula text not null,
  username text not null,
  email text not null,
  role public.app_role not null default 'membro',
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_nome_check
    check (char_length(btrim(nome)) between 3 and 120),
  constraint profiles_matricula_check
    check (matricula ~ '^[0-9]{6,12}$'),
  constraint profiles_username_check
    check (
      username ~ '^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$'
      and username !~ '^[0-9]+$'
    ),
  constraint profiles_email_check
    check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$')
);

create unique index profiles_matricula_key
  on public.profiles (matricula);
create unique index profiles_username_lower_key
  on public.profiles (lower(username));
create unique index profiles_email_lower_key
  on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);
create index profiles_active_idx on public.profiles (active);

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- Função de autorização usada pelas políticas RLS
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and active = true
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- Sem políticas de INSERT/UPDATE/DELETE para usuários autenticados.
-- A service role (Edge Functions) é quem cria e altera contas.

-- ----------------------------------------------------------------------------
-- updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Criação automática do perfil a partir de auth.users
--
-- As Edge Functions criam o usuário com user_metadata contendo nome,
-- matricula, username, role, must_change_password e created_by.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(new.raw_user_meta_data ->> 'nome', ''));
  v_matricula text := regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'matricula', ''),
    '\D',
    '',
    'g'
  );
  v_username text := lower(
    btrim(coalesce(new.raw_user_meta_data ->> 'username', ''))
  );
  v_role public.app_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.app_role,
    'membro'
  );
  v_must_change boolean := coalesce(
    (new.raw_user_meta_data ->> 'must_change_password')::boolean,
    true
  );
  v_created_by uuid := nullif(
    new.raw_user_meta_data ->> 'created_by',
    ''
  )::uuid;
begin
  if v_nome = '' or v_matricula = '' or v_username = '' then
    raise exception
      'user_metadata incompleto: informe nome, matricula e username';
  end if;

  if new.email is null or btrim(new.email) = '' then
    raise exception 'E-mail obrigatório para criar o perfil';
  end if;

  insert into public.profiles (
    id,
    nome,
    matricula,
    username,
    email,
    role,
    active,
    must_change_password,
    created_by
  )
  values (
    new.id,
    v_nome,
    v_matricula,
    v_username,
    lower(btrim(new.email)),
    v_role,
    true,
    v_must_change,
    v_created_by
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Mantém o e-mail do perfil sincronizado caso o Auth seja alterado.
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = lower(btrim(new.email))
  where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  execute function public.handle_user_email_update();

-- ----------------------------------------------------------------------------
-- Marcação de troca de senha concluída
-- O usuário só pode alterar a própria flag, nunca role/active.
-- ----------------------------------------------------------------------------
create or replace function public.mark_password_changed()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set must_change_password = false
  where id = auth.uid();
$$;

revoke all on function public.mark_password_changed() from public, anon;
grant execute on function public.mark_password_changed() to authenticated;

-- ----------------------------------------------------------------------------
-- Resolução de login por matrícula, usuário ou e-mail
-- Executada apenas pela service role (Edge Function de login).
-- Retorna NULL quando não há exatamente uma conta ativa.
-- ----------------------------------------------------------------------------
create or replace function public.resolve_login_email(p_identifier text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_normalized text := lower(btrim(coalesce(p_identifier, '')));
  v_digits text := regexp_replace(
    coalesce(p_identifier, ''),
    '\D',
    '',
    'g'
  );
  v_matches integer;
  v_email text;
begin
  select count(*), min(email)
  into v_matches, v_email
  from public.profiles
  where active = true
    and (
      (v_digits <> '' and matricula = v_digits)
      or lower(username) = v_normalized
      or lower(email) = v_normalized
    );

  if v_matches = 1 then
    return v_email;
  end if;

  return null;
end;
$$;

revoke all on function public.resolve_login_email(text)
  from public, anon, authenticated;
grant execute on function public.resolve_login_email(text) to service_role;

-- ----------------------------------------------------------------------------
-- Limitação de tentativas de login (defesa adicional à do GoTrue)
-- Guarda apenas hashes; nunca o IP ou o identificador em texto puro.
-- ----------------------------------------------------------------------------
create table public.login_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  identifier_hash text not null,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;

create index login_attempts_created_at_idx
  on public.login_attempts (created_at desc);
create index login_attempts_ip_idx
  on public.login_attempts (ip_hash, created_at desc);
create index login_attempts_identifier_idx
  on public.login_attempts (identifier_hash, created_at desc);

create or replace function public.is_login_locked(
  p_ip_hash text,
  p_identifier_hash text
)
returns table (locked boolean, retry_after_seconds integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ip_failures integer;
  v_id_failures integer;
  v_oldest timestamptz;
begin
  select count(*), min(created_at)
  into v_ip_failures, v_oldest
  from public.login_attempts
  where ip_hash = p_ip_hash
    and success = false
    and created_at > now() - interval '15 minutes';

  select count(*)
  into v_id_failures
  from public.login_attempts
  where identifier_hash = p_identifier_hash
    and success = false
    and created_at > now() - interval '15 minutes';

  if v_id_failures >= 5 or v_ip_failures >= 20 then
    if v_id_failures >= 5 then
      select min(created_at)
      into v_oldest
      from public.login_attempts
      where identifier_hash = p_identifier_hash
        and success = false
        and created_at > now() - interval '15 minutes';
    end if;

    return query
      select
        true,
        greatest(
          ceil(
            extract(epoch from (v_oldest + interval '15 minutes' - now()))
          )::integer,
          1
        );
    return;
  end if;

  return query select false, 0;
end;
$$;

revoke all on function public.is_login_locked(text, text)
  from public, anon, authenticated;
grant execute on function public.is_login_locked(text, text) to service_role;

create or replace function public.record_login_attempt(
  p_ip_hash text,
  p_identifier_hash text,
  p_success boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_success then
    delete from public.login_attempts
    where identifier_hash = p_identifier_hash
      and ip_hash = p_ip_hash;
  else
    insert into public.login_attempts (ip_hash, identifier_hash, success)
    values (p_ip_hash, p_identifier_hash, false);

    delete from public.login_attempts
    where created_at < now() - interval '1 day';
  end if;
end;
$$;

revoke all on function public.record_login_attempt(text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.record_login_attempt(text, text, boolean)
  to service_role;

-- ----------------------------------------------------------------------------
-- Auditoria administrativa
-- ----------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_id uuid references auth.users (id) on delete set null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create policy "audit_log_select_admin"
  on public.audit_log
  for select
  to authenticated
  using (public.is_admin());

create index audit_log_created_at_idx
  on public.audit_log (created_at desc);
