import { getAdminClient, getAnonClient } from '../_shared/supabase.ts';
import {
  corsHeaders,
  handleOptions,
  jsonResponse,
} from '../_shared/http.ts';
import {
  canonicalIdentifier,
  normalizeEmail,
} from '../_shared/validation.ts';
import {
  getClientIp,
  getHashSalt,
  hashValue,
} from '../_shared/rate-limit.ts';

const MAX_IDENTIFIER_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const DUMMY_EMAIL = 'nao-encontrado@dacomp.invalid';

async function recordAttempt(
  admin: ReturnType<typeof getAdminClient>,
  ipHash: string,
  identifierHash: string,
  success: boolean,
): Promise<void> {
  const { error } = await admin.rpc('record_login_attempt', {
    p_ip_hash: ipHash,
    p_identifier_hash: identifierHash,
    p_success: success,
  });

  if (error) {
    console.error('Falha ao registrar tentativa:', error.code);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(req);
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Método não permitido.' }, 405);
  }

  try {
    let body: { identifier?: unknown; password?: unknown };

    try {
      body = await req.json();
    } catch {
      return jsonResponse(req, { error: 'Requisição inválida.' }, 400);
    }

    const identifier = String(body.identifier ?? '').trim();
    const password = String(body.password ?? '');

    if (
      !identifier ||
      !password ||
      identifier.length > MAX_IDENTIFIER_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return jsonResponse(req, { error: 'Credenciais inválidas.' }, 401);
    }

    const admin = getAdminClient();
    const anon = getAnonClient();
    const salt = getHashSalt();
    const ipHash = await hashValue(getClientIp(req), salt);
    const identifierHash = await hashValue(
      canonicalIdentifier(identifier),
      salt,
    );

    const { data: lockData, error: lockError } = await admin.rpc(
      'is_login_locked',
      {
        p_ip_hash: ipHash,
        p_identifier_hash: identifierHash,
      },
    );

    if (lockError) {
      console.error('Falha ao verificar bloqueio:', lockError.code);
      return jsonResponse(
        req,
        { error: 'Não foi possível processar o login.' },
        500,
      );
    }

    const lock = Array.isArray(lockData) ? lockData[0] : lockData;

    if (lock?.locked) {
      const retryAfter = Math.max(
        1,
        Number(lock.retry_after_seconds ?? 0),
      );

      return new Response(
        JSON.stringify({
          error:
            'Muitas tentativas de login. Tente novamente mais tarde.',
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders(req),
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Retry-After': String(retryAfter),
          },
        },
      );
    }

    const { data: resolved, error: resolveError } = await admin.rpc(
      'resolve_login_email',
      { p_identifier: identifier },
    );

    if (resolveError) {
      console.error('Falha ao resolver identificador:', resolveError.code);
      return jsonResponse(
        req,
        { error: 'Não foi possível processar o login.' },
        500,
      );
    }

    const resolvedEmail =
      typeof resolved === 'string' ? normalizeEmail(resolved) : null;

    // Quando o identificador não existe, ainda chamamos o Auth com um
    // e-mail fictício para manter o fluxo e o custo semelhantes.
    const signInEmail = resolvedEmail ?? DUMMY_EMAIL;
    const signInPassword = resolvedEmail
      ? password
      : `${password}-${crypto.randomUUID()}`;

    const { data: authData, error: authError } =
      await anon.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

    if (!resolvedEmail || authError || !authData.session) {
      await recordAttempt(admin, ipHash, identifierHash, false);
      return jsonResponse(req, { error: 'Credenciais inválidas.' }, 401);
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select(
        'id, nome, matricula, username, email, role, active, must_change_password, created_at, last_login_at',
      )
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.active) {
      await recordAttempt(admin, ipHash, identifierHash, false);
      return jsonResponse(req, { error: 'Credenciais inválidas.' }, 401);
    }

    await recordAttempt(admin, ipHash, identifierHash, true);

    const now = new Date().toISOString();
    const { error: touchError } = await admin
      .from('profiles')
      .update({ last_login_at: now })
      .eq('id', profile.id);

    if (touchError) {
      console.error('Falha ao atualizar último acesso:', touchError.code);
    }

    return jsonResponse(req, {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_in: authData.session.expires_in,
      expires_at: authData.session.expires_at,
      token_type: authData.session.token_type,
      profile: {
        ...profile,
        last_login_at: now,
      },
    });
  } catch (error) {
    console.error(
      'Erro inesperado no login:',
      error instanceof Error ? error.name : 'unknown',
    );

    return jsonResponse(
      req,
      { error: 'Não foi possível processar o login.' },
      500,
    );
  }
});
