export type Role = 'aluno' | 'membro' | 'admin';

export type FieldErrors = Record<string, string>;

export type NewMemberData = {
  nome: string;
  matricula: string;
  username: string;
  email: string;
  password: string;
  role: Role;
};

const PASSWORD_MAX_LENGTH = 128;

export function normalizeName(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeUsername(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeMatricula(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function canonicalIdentifier(value: string): string {
  // Usado apenas para a chave de rate limiting; remove espaços e
  // normaliza a caixa para que variações não multipliquem tentativas.
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

export function isValidName(value: string): boolean {
  const name = normalizeName(value);

  return (
    name.length >= 3 &&
    name.length <= 120 &&
    /^[\p{L}\p{M}' .-]+$/u.test(name)
  );
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);

  return (
    email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

export function isValidUsername(value: string): boolean {
  const username = normalizeUsername(value);

  return (
    /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/.test(username) &&
    !/^\d+$/.test(username)
  );
}

export function isValidMatricula(value: string): boolean {
  return /^[A-Z0-9]{6,20}$/.test(normalizeMatricula(value));
}

export function getPasswordIssues(password: string): string[] {
  const issues: string[] = [];

  if (password.length < 10) {
    issues.push('pelo menos 10 caracteres');
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    issues.push(`no máximo ${PASSWORD_MAX_LENGTH} caracteres`);
  }
  if (!/[a-z]/.test(password)) {
    issues.push('uma letra minúscula');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('uma letra maiúscula');
  }
  if (!/[0-9]/.test(password)) {
    issues.push('um número');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push('um caractere especial');
  }

  return issues;
}

export function validateNewMember(input: Record<string, unknown>): {
  errors: FieldErrors;
  data: NewMemberData;
} {
  const errors: FieldErrors = {};

  const nome = normalizeName(input.nome);
  const matricula = normalizeMatricula(input.matricula);
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);
  const password = String(input.password ?? '');
  const role: Role =
    input.role === 'admin'
      ? 'admin'
      : input.role === 'membro'
        ? 'membro'
        : 'aluno';

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

  const passwordIssues = getPasswordIssues(password);
  if (passwordIssues.length > 0) {
    errors.password = `A senha precisa de ${passwordIssues.join(', ')}.`;
  }

  return {
    errors,
    data: {
      nome,
      matricula,
      username,
      email,
      password,
      role,
    },
  };
}

function secureRandomIndex(max: number): number {
  const limit = Math.floor(256 / max) * max;
  const buffer = new Uint8Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
}

export function generateTemporaryPassword(length = 20): string {
  const pools = [
    'abcdefghijkmnopqrstuvwxyz',
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    '23456789',
    '!@#$%&*+-=?',
  ];
  const all = pools.join('');
  const characters = pools.map(
    (pool) => pool[secureRandomIndex(pool.length)],
  );
  const safeLength = Math.max(length, pools.length + 2);

  while (characters.length < safeLength) {
    characters.push(all[secureRandomIndex(all.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters.join('');
}
