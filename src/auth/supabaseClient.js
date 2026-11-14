import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local.'
  );
}

const REMEMBER_KEY = 'dacomp.remember';

/**
 * "Manter sessão neste dispositivo" escolhe entre localStorage (persistente)
 * e sessionStorage (some ao fechar o navegador). O token nunca é enviado
 * para o banco; o Supabase Auth gerencia a sessão.
 */
const authStorage = {
  getItem(key) {
    try {
      return (
        window.localStorage.getItem(key) ??
        window.sessionStorage.getItem(key)
      );
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      const remember =
        window.localStorage.getItem(REMEMBER_KEY) === 'true';
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
      (remember ? window.localStorage : window.sessionStorage).setItem(
        key,
        value
      );
    } catch {
      // Armazenamento indisponível: a sessão funciona só em memória.
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // Nada a remover.
    }
  },
};

export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
    storageKey: 'dacomp.auth',
  },
});

export function setRememberPreference(remember) {
  try {
    window.localStorage.setItem(
      REMEMBER_KEY,
      remember ? 'true' : 'false'
    );
  } catch {
    // Preferência não persistida.
  }
}

export function clearRememberPreference() {
  try {
    window.localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Nada a remover.
  }
}

export function getRememberPreference() {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) === 'true';
  } catch {
    return false;
  }
}
