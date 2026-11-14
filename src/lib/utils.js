export function getInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'DA';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(date);
}

export function roleLabel(role) {
  if (role === 'admin') {
    return 'Administrador';
  }

  if (role === 'membro') {
    return 'Membro';
  }

  return 'Aluno';
}

export function buildCredentialsText(account, password) {
  return [
    'DACOMP UFU — Credenciais de acesso',
    `Nome: ${account.nome}`,
    `Matrícula: ${account.matricula}`,
    `Usuário: ${account.username}`,
    `E-mail: ${account.email}`,
    `Senha temporária: ${password}`,
    '',
    'No primeiro acesso será solicitada a definição de uma nova senha.',
  ].join('\n');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
