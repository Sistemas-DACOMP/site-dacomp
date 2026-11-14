import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type AdminProfile = {
  id: string;
  nome: string;
  role: 'aluno' | 'membro' | 'admin';
  active: boolean;
};

export type AdminCheck =
  | {
      ok: true;
      userId: string;
      profile: AdminProfile;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export async function requireAdmin(
  req: Request,
  admin: SupabaseClient,
): Promise<AdminCheck> {
  const authorization = req.headers.get('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';

  if (!token) {
    return { ok: false, status: 401, error: 'Não autenticado.' };
  }

  const { data: userData, error: userError } = await admin.auth.getUser(
    token,
  );

  if (userError || !userData.user) {
    return { ok: false, status: 401, error: 'Sessão inválida.' };
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, nome, role, active')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, status: 403, error: 'Perfil não encontrado.' };
  }

  if (!profile.active || profile.role !== 'admin') {
    return {
      ok: false,
      status: 403,
      error: 'Apenas administradores ativos podem realizar esta ação.',
    };
  }

  return {
    ok: true,
    userId: userData.user.id,
    profile: profile as AdminProfile,
  };
}
