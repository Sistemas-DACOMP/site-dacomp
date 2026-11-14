import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export async function writeAudit(
  admin: SupabaseClient,
  actorId: string,
  action: string,
  targetId: string | null,
  details: string | null,
): Promise<void> {
  const { error } = await admin.from('audit_log').insert({
    actor_id: actorId,
    action,
    target_id: targetId,
    details,
  });

  if (error) {
    // Nunca registra corpo da requisição, senha ou token.
    console.error('Falha ao registrar auditoria:', error.code);
  }
}
