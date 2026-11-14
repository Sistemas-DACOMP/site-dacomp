/**
 * Provisiona o primeiro administrador do DACOMP.
 *
 * Uso (nunca commite a secret key):
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... ADMIN_NOME=... \
 *   ADMIN_MATRICULA=... ADMIN_USERNAME=... ADMIN_EMAIL=... \
 *   ADMIN_PASSWORD=... node scripts/seed-admin.mjs
 *
 * O script não imprime a senha. O perfil é criado pelo trigger
 * on_auth_user_created a partir do user_metadata.
 */

import { createClient } from '@supabase/supabase-js';

function requireEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }

  return value.trim();
}

function normalizeMatricula(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function isValidPassword(value) {
  return (
    value.length >= 10 &&
    value.length <= 128 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

const url = requireEnv('SUPABASE_URL');
const secretKey = requireEnv('SUPABASE_SECRET_KEY');
const nome = requireEnv('ADMIN_NOME');
const matricula = normalizeMatricula(requireEnv('ADMIN_MATRICULA'));
const username = requireEnv('ADMIN_USERNAME').toLowerCase();
const email = requireEnv('ADMIN_EMAIL').toLowerCase();
const password = requireEnv('ADMIN_PASSWORD');

if (!/^[A-Z0-9]{6,20}$/.test(matricula)) {
  throw new Error('Matrícula deve ter de 6 a 20 letras/números.');
}

if (
  !/^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/.test(username) ||
  /^\d+$/.test(username)
) {
  throw new Error('Nome de usuário inválido.');
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  throw new Error('E-mail inválido.');
}

if (!isValidPassword(password)) {
  throw new Error(
    'A senha precisa de 10+ caracteres, maiúscula, minúscula, número e símbolo.'
  );
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingAdmins, error: adminLookupError } = await supabase
  .from('profiles')
  .select('id, nome')
  .eq('role', 'admin')
  .limit(1);

if (adminLookupError) {
  throw new Error(`Falha ao consultar administradores: ${adminLookupError.message}`);
}

if (existingAdmins && existingAdmins.length > 0) {
  console.log(
    `Já existe um administrador (${existingAdmins[0].nome}). Nada foi criado.`
  );
  process.exit(0);
}

const { data: created, error: createError } =
  await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome,
      matricula,
      username,
      role: 'admin',
      must_change_password: true,
      created_by: null,
    },
  });

if (createError || !created.user) {
  throw new Error(
    `Falha ao criar o administrador: ${createError?.message ?? 'erro desconhecido'}`
  );
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select(
    'id, nome, matricula, username, email, role, active, must_change_password'
  )
  .eq('id', created.user.id)
  .single();

if (profileError || !profile) {
  console.error(
    `Usuário criado, mas o perfil não foi encontrado: ${profileError?.message}`
  );
  process.exit(1);
}

console.log('Administrador criado com sucesso:');
console.log(
  JSON.stringify(
    {
      id: profile.id,
      nome: profile.nome,
      matricula: profile.matricula,
      username: profile.username,
      email: profile.email,
      role: profile.role,
      must_change_password: profile.must_change_password,
    },
    null,
    2
  )
);
console.log(
  'Use a senha definida em ADMIN_PASSWORD para o primeiro acesso e troque-a em seguida.'
);
