import { createClient } from 'npm:@supabase/supabase-js@2';

function requireEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }

  return value;
}

function getProjectUrl(): string {
  return Deno.env.get('SUPABASE_URL') ?? requireEnv('SUPABASE_URL');
}

function getSecretKey(): string {
  const key =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SUPABASE_SECRET_KEY');

  if (!key) {
    throw new Error('Service role key ausente no ambiente.');
  }

  return key;
}

function getPublishableKey(): string {
  const key =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY');

  if (!key) {
    throw new Error('Publishable/anon key ausente no ambiente.');
  }

  return key;
}

export function getAdminClient() {
  return createClient(getProjectUrl(), getSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getAnonClient() {
  return createClient(getProjectUrl(), getPublishableKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
