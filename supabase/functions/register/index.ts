import { getAdminClient } from '../_shared/supabase.ts';
import {
  corsHeaders,
  handleOptions,
  jsonResponse,
} from '../_shared/http.ts';
import { validateNewMember } from '../_shared/validation.ts';
import {
  getClientIp,
  getHashSalt,
  hashValue,
} from '../_shared/rate-limit.ts';
import { writeAudit } from '../_shared/audit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(req);
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Método não permitido.' }, 405);
  }

  try {
    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(req, { error: 'Requisição inválida.' }, 400);
    }

    // O papel é sempre aluno; qualquer role enviado pelo cliente é ignorado.
    const { errors, data } = validateNewMember({
      ...body,
      role: 'aluno',
    });

    if (Object.keys(errors).length > 0) {
      return jsonResponse(
        req,
        {
          error: 'Verifique os campos destacados.',
          fieldErrors: errors,
        },
        422,
      );
    }

    const admin = getAdminClient();
    const salt = getHashSalt();
    const ipHash = await hashValue(getClientIp(req), salt);

    const { data: allowed, error: limitError } = await admin.rpc(
      'is_registration_allowed',
      { p_ip_hash: ipHash },
    );

    if (limitError) {
      console.error('Falha ao verificar limite:', limitError.code);
      return jsonResponse(
        req,
        { error: 'Não foi possível concluir o cadastro.' },
        500,
      );
    }

    if (allowed === false) {
      return new Response(
        JSON.stringify({
          error:
            'Muitos cadastros deste dispositivo. Tente novamente mais tarde.',
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders(req),
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Retry-After': '3600',
          },
        },
      );
    }

    const { error: recordError } = await admin.rpc(
      'record_registration_attempt',
      { p_ip_hash: ipHash },
    );

    if (recordError) {
      console.error('Falha ao registrar tentativa:', recordError.code);
    }

    const [matriculaCheck, usernameCheck, emailCheck] = await Promise.all([
      admin
        .from('profiles')
        .select('id')
        .eq('matricula', data.matricula)
        .maybeSingle(),
      admin
        .from('profiles')
        .select('id')
        .eq('username', data.username)
        .maybeSingle(),
      admin
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .maybeSingle(),
    ]);

    if (matriculaCheck.error || usernameCheck.error || emailCheck.error) {
      console.error('Falha ao verificar duplicidade no cadastro.');
      return jsonResponse(
        req,
        { error: 'Não foi possível validar os dados.' },
        500,
      );
    }

    const fieldErrors: Record<string, string> = {};

    if (matriculaCheck.data) {
      fieldErrors.matricula = 'Já existe uma conta com esta matrícula.';
    }
    if (usernameCheck.data) {
      fieldErrors.username = 'Já existe uma conta com este usuário.';
    }
    if (emailCheck.data) {
      fieldErrors.email = 'Já existe uma conta com este e-mail.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return jsonResponse(
        req,
        {
          error: 'Verifique os campos destacados.',
          fieldErrors,
        },
        409,
      );
    }

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          nome: data.nome,
          matricula: data.matricula,
          username: data.username,
          role: 'aluno',
          must_change_password: false,
          created_by: null,
        },
      });

    if (createError || !created.user) {
      console.error('Falha ao criar aluno:', createError?.code);
      return jsonResponse(
        req,
        { error: 'Não foi possível criar a conta. Verifique os dados.' },
        409,
      );
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', created.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Perfil não criado pelo trigger:', profileError?.code);
      await admin.auth.admin.deleteUser(created.user.id);

      return jsonResponse(
        req,
        { error: 'Não foi possível concluir o cadastro.' },
        500,
      );
    }

    await writeAudit(
      admin,
      created.user.id,
      'account.self_registered',
      created.user.id,
      `${data.nome} (${data.matricula})`,
    );

    return jsonResponse(req, { profile }, 201);
  } catch (error) {
    console.error(
      'Erro inesperado no cadastro público:',
      error instanceof Error ? error.name : 'unknown',
    );

    return jsonResponse(
      req,
      { error: 'Não foi possível concluir o cadastro.' },
      500,
    );
  }
});
