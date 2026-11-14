function getCrypto() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      'A geração segura de senha exige HTTPS ou localhost.'
    );
  }

  return globalThis.crypto;
}

function secureRandomIndex(max) {
  if (!Number.isInteger(max) || max <= 0 || max > 256) {
    throw new RangeError('Intervalo inválido.');
  }

  const limit = Math.floor(256 / max) * max;
  const buffer = new Uint8Array(1);

  do {
    getCrypto().getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
}

/**
 * Gera uma senha temporária forte para o primeiro acesso de um membro.
 * A senha é enviada à Edge Function e validada novamente no servidor.
 */
export function generateTemporaryPassword(length = 20) {
  const pools = [
    'abcdefghijkmnopqrstuvwxyz',
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    '23456789',
    '!@#$%&*+-=?',
  ];
  const all = pools.join('');
  const characters = pools.map(
    (pool) => pool[secureRandomIndex(pool.length)]
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
