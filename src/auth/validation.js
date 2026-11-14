export const ROLES = Object.freeze({
  ALUNO: 'aluno',
  MEMBRO: 'membro',
  ADMIN: 'admin',
});

export const PASSWORD_MAX_LENGTH = 128;

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeMatricula(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function normalizeName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function isValidName(value) {
  const name = normalizeName(value);
  return (
    name.length >= 3 &&
    name.length <= 120 &&
    /^[\p{L}\p{M}' .-]+$/u.test(name)
  );
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  return (
    email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

export function isValidUsername(value) {
  const username = normalizeUsername(value);

  return (
    /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/.test(username) &&
    // Evita ambiguidade com a matrícula no momento do login.
    !/^\d+$/.test(username)
  );
}

export function isValidMatricula(value) {
  return /^[A-Z0-9]{6,20}$/.test(normalizeMatricula(value));
}

export function getPasswordIssues(password) {
  const value = String(password ?? '');
  const issues = [];

  if (value.length < 10) {
    issues.push('pelo menos 10 caracteres');
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    issues.push(`no máximo ${PASSWORD_MAX_LENGTH} caracteres`);
  }
  if (!/[a-z]/.test(value)) {
    issues.push('uma letra minúscula');
  }
  if (!/[A-Z]/.test(value)) {
    issues.push('uma letra maiúscula');
  }
  if (!/[0-9]/.test(value)) {
    issues.push('um número');
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    issues.push('um caractere especial');
  }

  return issues;
}

/**
 * Valida os dados de criação de conta. As verificações de duplicidade
 * comparam valores já normalizados (sem diferenciar maiúsculas de minúsculas).
 */
export function validateNewAccount(input, users) {
  const errors = {};
  const nome = normalizeName(input?.nome);
  const matricula = normalizeMatricula(input?.matricula);
  const username = normalizeUsername(input?.username);
  const email = normalizeEmail(input?.email);
  const role =
    input?.role === ROLES.ADMIN
      ? ROLES.ADMIN
      : input?.role === ROLES.MEMBRO
        ? ROLES.MEMBRO
        : ROLES.ALUNO;

  if (!isValidName(nome)) {
    errors.nome = 'Informe o nome completo (3 a 120 caracteres).';
  }

  if (!isValidMatricula(matricula)) {
    errors.matricula =
      'A matrícula deve ter de 6 a 20 caracteres (letras e números).';
  }

  if (!isValidUsername(username)) {
    errors.username =
      /^\d+$/.test(username) && username.length >= 3
        ? 'O nome de usuário não pode ser composto apenas por números, para não conflitar com a matrícula.'
        : 'Use de 3 a 32 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado.';
  }

  if (!isValidEmail(email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  const passwordIssues = getPasswordIssues(input?.password);
  if (passwordIssues.length > 0) {
    errors.password = `A senha precisa de ${passwordIssues.join(', ')}.`;
  }

  if (String(input?.password ?? '') !== String(input?.confirmPassword ?? '')) {
    errors.confirmPassword = 'As senhas não coincidem.';
  }

  const safeUsers = Array.isArray(users) ? users : [];

  if (matricula && safeUsers.some((user) => user.matricula === matricula)) {
    errors.matricula = 'Já existe uma conta com esta matrícula.';
  }
  if (username && safeUsers.some((user) => user.username === username)) {
    errors.username = 'Já existe uma conta com este usuário.';
  }
  if (email && safeUsers.some((user) => user.email === email)) {
    errors.email = 'Já existe uma conta com este e-mail.';
  }

  return {
    errors,
    data: {
      nome,
      matricula,
      username,
      email,
      role,
      password: String(input?.password ?? ''),
    },
  };
}

export function validatePasswordChange(input) {
  const errors = {};

  if (!String(input?.currentPassword ?? '')) {
    errors.currentPassword = 'Informe a senha atual.';
  }

  const passwordIssues = getPasswordIssues(input?.newPassword);
  if (passwordIssues.length > 0) {
    errors.newPassword = `A nova senha precisa de ${passwordIssues.join(', ')}.`;
  }

  if (
    String(input?.newPassword ?? '') !== String(input?.confirmPassword ?? '')
  ) {
    errors.confirmPassword = 'As senhas não coincidem.';
  }

  return errors;
}
