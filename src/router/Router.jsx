import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const RouterContext = createContext(null);

function readPathname() {
  const pathname = window.location.pathname.replace(/\/+$/, '');
  return pathname || '/';
}

function isSafeInternalPath(path) {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('\\')
  );
}

export function RouterProvider({ children }) {
  const [path, setPath] = useState(readPathname);

  useEffect(() => {
    const handlePopState = () => setPath(readPathname());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to, options = {}) => {
    if (!isSafeInternalPath(to)) {
      return;
    }

    const { replace = false } = options;

    if (replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }

    setPath(readPathname());
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const value = useMemo(() => ({ path, navigate }), [navigate, path]);

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error('useRouter deve ser usado dentro de um RouterProvider.');
  }

  return context;
}

export function Link({ to, onClick, children, ...rest }) {
  const { navigate } = useRouter();

  const handleClick = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export function Navigate({ to, replace = false }) {
  const { navigate } = useRouter();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
}

/**
 * Lê o parâmetro ?next= de forma segura, aceitando apenas caminhos internos.
 */
export function getSafeNextPath(fallback = '/perfil') {
  try {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');

    if (
      next &&
      isSafeInternalPath(next) &&
      !next.startsWith('/login') &&
      !next.startsWith('/setup')
    ) {
      return next;
    }
  } catch {
    // URL inválida: usa o fallback.
  }

  return fallback;
}
