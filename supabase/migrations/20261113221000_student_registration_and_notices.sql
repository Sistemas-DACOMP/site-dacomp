-- ============================================================================
-- Cadastro público de alunos + gestão geral de avisos (membro/admin)
-- ============================================================================

alter table public.profiles
  alter column role set default 'aluno';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(new.raw_user_meta_data ->> 'nome', ''));
  v_matricula text := upper(
    regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'matricula', ''),
      '[^0-9A-Za-z]',
      '',
      'g'
    )
  );
  v_username text := lower(
    btrim(coalesce(new.raw_user_meta_data ->> 'username', ''))
  );
  v_role public.app_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.app_role,
    'aluno'
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

  if v_matricula !~ '^[A-Z0-9]{6,20}$' then
    raise exception 'Matrícula inválida: use de 6 a 20 letras/números';
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

-- Membro do DA ou admin: pode gerenciar avisos internos.
create or replace function public.is_staff()
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
      and active = true
      and role in (
        'membro'::public.app_role,
        'admin'::public.app_role
      )
  );
$$;

revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- ----------------------------------------------------------------------------
-- Avisos internos da gestão
-- ----------------------------------------------------------------------------
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_title_check
    check (char_length(btrim(title)) between 3 and 120),
  constraint notices_body_check
    check (char_length(btrim(body)) between 3 and 2000)
);

create index notices_created_at_idx
  on public.notices (created_at desc);

create trigger notices_set_updated_at
  before update on public.notices
  for each row
  execute function public.set_updated_at();

alter table public.notices enable row level security;
revoke all on public.notices from anon, authenticated;
grant select, insert, update, delete on public.notices to authenticated;

create policy "notices_select_staff"
  on public.notices
  for select
  to authenticated
  using (public.is_staff());

create policy "notices_insert_staff"
  on public.notices
  for insert
  to authenticated
  with check (public.is_staff() and created_by = auth.uid());

create policy "notices_update_staff"
  on public.notices
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "notices_delete_staff"
  on public.notices
  for delete
  to authenticated
  using (public.is_staff());

-- ----------------------------------------------------------------------------
-- Rate limit do cadastro público (hashes de IP; sem PII em texto puro)
-- ----------------------------------------------------------------------------
create table public.registration_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.registration_attempts enable row level security;
revoke all on public.registration_attempts from anon, authenticated;

create index registration_attempts_ip_idx
  on public.registration_attempts (ip_hash, created_at desc);
create index registration_attempts_created_at_idx
  on public.registration_attempts (created_at desc);

create or replace function public.is_registration_allowed(p_ip_hash text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) < 10
  from public.registration_attempts
  where ip_hash = p_ip_hash
    and created_at > now() - interval '1 hour';
$$;

create or replace function public.record_registration_attempt(p_ip_hash text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.registration_attempts (ip_hash)
  values (p_ip_hash);

  delete from public.registration_attempts
  where created_at < now() - interval '1 day';
$$;

revoke all on function public.is_registration_allowed(text)
  from public, anon, authenticated;
grant execute on function public.is_registration_allowed(text) to service_role;

revoke all on function public.record_registration_attempt(text)
  from public, anon, authenticated;
grant execute on function public.record_registration_attempt(text) to service_role;
