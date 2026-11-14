/**
 * Operação administrativa pontual: altera a flag must_change_password
 * de um perfil pelo e-mail. Usa a service role key apenas no servidor/local.
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... ADMIN_EMAIL=... \
 *   MUST_CHANGE=true|false node scripts/set-must-change.mjs
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const email = String(process.env.ADMIN_EMAIL ?? '')
  .trim()
  .toLowerCase();
const mustChange =
  String(process.env.MUST_CHANGE ?? '').toLowerCase() === 'true';

if (!url || !secretKey || !email) {
  throw new Error(
    'Informe SUPABASE_URL, SUPABASE_SECRET_KEY e ADMIN_EMAIL.'
  );
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from('profiles')
  .update({ must_change_password: mustChange })
  .eq('email', email)
  .select('id, email, must_change_password')
  .maybeSingle();

if (error) {
  throw new Error(`Falha ao atualizar a flag: ${error.message}`);
}

if (!data) {
  throw new Error('Perfil não encontrado para o e-mail informado.');
}

console.log(data);
