import { getAdminClient } from '../_shared/supabase.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { generateTemporaryPassword } from '../_shared/validation.ts';
import { writeAudit } from '../_shared/audit.ts';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_ACTIONS = [
  'set_role',
  'set_active',
  'delete',
  'reset_password',
] as const;

type Action = (typeof ALLOWED_ACTIONS)[number];

type TargetProfile = {
  id: string;
  nome: string;
  matricula: string;
  role: 'aluno' | 'membro' | 'admin';
  active: boolean;
};

function isAction(value: unknown): value is Action {
  return (
    typeof value === 'string' &&
    (ALLOWED_ACTIONS as readonly string[]).includes(value)
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(req);
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Método não permitido.' }, 405);
  }

  try {
    const admin = getAdminClient();
    const auth = await requireAdmin(req, admin);

    if (!auth.ok) {
      return jsonResponse(req, { error: auth.error }, auth.status);
    }

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(req, { error: 'Requisição inválida.' }, 400);
    }

    const action = body.action;

    if (!isAction(action)) {
      return jsonResponse(req, { error: 'Ação inválida.' }, 400);
    }

    const userId = String(body.userId ?? '').trim();

    if (!UUID_PATTERN.test(userId)) {
      return jsonResponse(req, { error: 'Conta inválida.' }, 400);
    }

    if (userId === auth.userId) {
      return jsonResponse(
        req,
        {
          error:
            'Você não pode gerenciar a própria conta por este painel. Use o seu perfil.',
        },
        409,
      );
    }

    const { data: target, error: targetError } = await admin
      .from('profiles')
      .select('id, nome, matricula, role, active')
      .eq('id', userId)
      .maybeSingle();

    if (targetError || !target) {
      return jsonResponse(req, { error: 'Conta não encontrada.' }, 404);
    }

    const profile = target as TargetProfile;

    const { count: activeAdmins, error: countError } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('active', true);

    if (countError) {
      console.error('Falha ao contar administradores:', countError.code);
      return jsonResponse(
        req,
        { error: 'Não foi possível processar a ação.' },
        500,
      );
    }

    const adminCount = activeAdmins ?? 0;

    if (action === 'set_role') {
      const role =
        body.role === 'admin'
          ? 'admin'
          : body.role === 'membro'
            ? 'membro'
            : body.role === 'aluno'
              ? 'aluno'
              : null;

      if (!role) {
        return jsonResponse(req, { error: 'Função inválida.' }, 400);
      }

      if (role === profile.role) {
        return jsonResponse(req, { profile });
      }

      if (
        profile.role === 'admin' &&
        profile.active &&
        role !== 'admin' &&
        adminCount <= 1
      ) {
        return jsonResponse(
          req,
          {
            error:
              'O sistema precisa manter pelo menos um administrador ativo.',
          },
          409,
        );
      }

      const { data: updated, error: updateError } = await admin
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select('*')
        .single();

      if (updateError || !updated) {
        console.error('Falha ao alterar função:', updateError?.code);
        return jsonResponse(
          req,
          { error: 'Não foi possível alterar a função.' },
          500,
        );
      }

      await writeAudit(
        admin,
        auth.userId,
        'account.role_changed',
        userId,
        `${profile.nome}: ${profile.role} -> ${role}`,
      );

      return jsonResponse(req, { profile: updated });
    }

    if (action === 'set_active') {
      if (typeof body.active !== 'boolean') {
        return jsonResponse(req, { error: 'Estado inválido.' }, 400);
      }

      const active = body.active;

      if (active === profile.active) {
        return jsonResponse(req, { profile });
      }

      if (
        !active &&
        profile.role === 'admin' &&
        profile.active &&
        adminCount <= 1
      ) {
        return jsonResponse(
          req,
          {
            error:
              'O sistema precisa manter pelo menos um administrador ativo.',
          },
          409,
        );
      }

      // Bloqueia/desbloqueia o login no Auth antes de mudar o perfil.
      const { error: authError } = await admin.auth.admin.updateUserById(
        userId,
        { ban_duration: active ? 'none' : '876000h' },
      );

      if (authError) {
        console.error('Falha ao alterar bloqueio:', authError.code);
        return jsonResponse(
          req,
          { error: 'Não foi possível alterar o acesso desta conta.' },
          500,
        );
      }

      const { data: updated, error: updateError } = await admin
        .from('profiles')
        .update({ active })
        .eq('id', userId)
        .select('*')
        .single();

      if (updateError || !updated) {
        console.error('Falha ao alterar estado:', updateError?.code);

        // Rollback do bloqueio para manter Auth e perfil consistentes.
        await admin.auth.admin.updateUserById(userId, {
          ban_duration: active ? '876000h' : 'none',
        });

        return jsonResponse(
          req,
          { error: 'Não foi possível alterar o estado da conta.' },
          500,
        );
      }

      await writeAudit(
        admin,
        auth.userId,
        active ? 'account.activated' : 'account.deactivated',
        userId,
        profile.nome,
      );

      return jsonResponse(req, { profile: updated });
    }

    if (action === 'delete') {
      if (
        profile.role === 'admin' &&
        profile.active &&
        adminCount <= 1
      ) {
        return jsonResponse(
          req,
          {
            error:
              'O sistema precisa manter pelo menos um administrador ativo.',
          },
          409,
        );
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(
        userId,
      );

      if (deleteError) {
        console.error('Falha ao excluir usuário:', deleteError.code);
        return jsonResponse(
          req,
          { error: 'Não foi possível excluir a conta.' },
          500,
        );
      }

      await writeAudit(
        admin,
        auth.userId,
        'account.deleted',
        null,
        `${profile.nome} (${profile.matricula})`,
      );

      return jsonResponse(req, { deleted: true });
    }

    // reset_password
    const temporaryPassword = generateTemporaryPassword();

    const { error: passwordError } = await admin.auth.admin.updateUserById(
      userId,
      { password: temporaryPassword },
    );

    if (passwordError) {
      console.error('Falha ao redefinir senha:', passwordError.code);
      return jsonResponse(
        req,
        { error: 'Não foi possível gerar a senha temporária.' },
        500,
      );
    }

    const { error: flagError } = await admin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId);

    if (flagError) {
      console.error('Falha ao marcar troca de senha:', flagError.code);
      return jsonResponse(
        req,
        { error: 'A senha foi alterada, mas não foi possível concluir.' },
        500,
      );
    }

    await writeAudit(
      admin,
      auth.userId,
      'account.password_reset',
      userId,
      profile.nome,
    );

    return jsonResponse(req, { temporaryPassword });
  } catch (error) {
    console.error(
      'Erro inesperado ao gerenciar membro:',
      error instanceof Error ? error.name : 'unknown',
    );

    return jsonResponse(
      req,
      { error: 'Não foi possível processar a ação.' },
      500,
    );
  }
});
