export function getHashSalt(): string {
  const salt = Deno.env.get('LOGIN_HASH_SALT');

  if (!salt) {
    throw new Error('LOGIN_HASH_SALT não configurado.');
  }

  return salt;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  const first = forwarded.split(',')[0]?.trim();

  return (
    first ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function hashValue(
  value: string,
  salt: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
