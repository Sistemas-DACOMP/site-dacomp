-- ============================================================================
-- Suporte a matrícula alfanumérica da UFU (ex.: 12411BSI224)
-- Normalização: trim, maiúsculas, remove separadores, mantém A-Z e 0-9.
-- ============================================================================

alter table public.profiles
  drop constraint if exists profiles_matricula_check;

alter table public.profiles
  add constraint profiles_matricula_check
  check (matricula ~ '^[A-Z0-9]{6,20}$');

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

create or replace function public.resolve_login_email(p_identifier text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_normalized text := lower(btrim(coalesce(p_identifier, '')));
  v_matricula text := upper(
    regexp_replace(
      coalesce(p_identifier, ''),
      '[^0-9A-Za-z]',
      '',
      'g'
    )
  );
  v_matches integer;
  v_email text;
begin
  select count(*), min(email)
  into v_matches, v_email
  from public.profiles
  where active = true
    and (
      (v_matricula <> '' and matricula = v_matricula)
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
