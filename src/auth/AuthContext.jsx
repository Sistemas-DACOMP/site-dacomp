import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  clearRememberPreference,
  getRememberPreference,
  setRememberPreference,
  supabase,
} from './supabaseClient';
import {
  ROLES,
  validateNewAccount,
  validatePasswordChange,
} from './validation';

const AuthContext = createContext(null);

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(fieldErrors) {
    super('Verifique os campos destacados.');
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

function mapProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    nome: row.nome,
    matricula: row.matricula,
    username: row.username,
    email: row.email,
    role: row.role,
    active: row.active,
    mustChangePassword: row.must_change_password,
    createdBy: row.created_by,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditEntry(row) {
  return {
    id: String(row.id),
    action: row.action,
    actorId: row.actor_id,
    targetId: row.target_id,
    details: row.details,
    at: row.created_at,
  };
}

async function fetchProfileRow(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new AuthError('Não foi possível carregar seu perfil.');
  }

  return data;
}

async function throwFunctionError(error, fallback) {
  let message = fallback;
  let fieldErrors = null;

  if (error?.context?.json) {
    try {
      const payload = await error.context.json();
      if (payload?.error) {
        message = payload.error;
      }
      if (payload?.fieldErrors) {
        fieldErrors = payload.fieldErrors;
      }
    } catch {
      // Corpo não-JSON: mantém a mensagem padrão.
    }
  }

  if (fieldErrors) {
    throw new ValidationError(fieldErrors);
  }

  throw new AuthError(message);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [initializing, setInitializing] = useState(true);
  const profileRequestRef = useRef(0);

  const loadAdminData = useCallback(async () => {
    const [profilesResult, logsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .order('nome', { ascending: true }),
      supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    if (profilesResult.error) {
      throw new AuthError('Não foi possível carregar as contas.');
    }

    setUsers((profilesResult.data ?? []).map(mapProfile));

    if (!logsResult.error) {
      setAuditLog((logsResult.data ?? []).map(mapAuditEntry));
    }
  }, []);

  useEffect(() => {
    let active = true;

    const sync = async (nextSession) => {
      if (!active) {
        return;
      }

      const requestId = profileRequestRef.current + 1;
      profileRequestRef.current = requestId;
      setSession(nextSession);

      if (!nextSession?.user) {
        setCurrentUser(null);
        setUsers([]);
        setAuditLog([]);
        setInitializing(false);
        return;
      }

      let row;

      try {
        row = await fetchProfileRow(nextSession.user.id);
      } catch {
        if (active && requestId === profileRequestRef.current) {
          setCurrentUser(null);
          setInitializing(false);
        }
        return;
      }

      if (!active || requestId !== profileRequestRef.current) {
        return;
      }

      if (!row || !row.active) {
        await supabase.auth.signOut();
        if (!active) {
          return;
        }
        setCurrentUser(null);
        setUsers([]);
        setAuditLog([]);
        setInitializing(false);
        return;
      }

      const profile = mapProfile(row);
      setCurrentUser(profile);

      if (profile.role === ROLES.ADMIN) {
        try {
          await loadAdminData();
        } catch {
          // Mantém o perfil; o painel pode tentar carregar novamente.
        }
      } else {
        setUsers([]);
        setAuditLog([]);
      }

      if (active) {
        setInitializing(false);
      }
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }
      if (error) {
        setInitializing(false);
        return;
      }
      void sync(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) {
        return;
      }

      if (event === 'SIGNED_OUT') {
        profileRequestRef.current += 1;
        setSession(null);
        setCurrentUser(null);
        setUsers([]);
        setAuditLog([]);
        setInitializing(false);
        return;
      }

      // Evita deadlock ao chamar supabase-js dentro do callback.
      window.setTimeout(() => {
        void sync(nextSession);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadAdminData]);

  const login = useCallback(
    async ({ identifier, password, remember = false }) => {
      setRememberPreference(remember);

      const { data, error } = await supabase.functions.invoke('login', {
        body: { identifier, password },
      });

      if (error) {
        clearRememberPreference();
        await throwFunctionError(error, 'Credenciais inválidas.');
      }

      if (!data?.access_token || !data?.refresh_token) {
        clearRememberPreference();
        throw new AuthError('Não foi possível iniciar a sessão.');
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        clearRememberPreference();
        throw new AuthError('Não foi possível iniciar a sessão.');
      }

      const profile = data.profile ? mapProfile(data.profile) : null;

      if (profile) {
        profileRequestRef.current += 1;
        setCurrentUser(profile);

        if (profile.role === ROLES.ADMIN) {
          try {
            await loadAdminData();
          } catch {
            // O painel recarrega ao abrir.
          }
        }
      }

      return profile;
    },
    [loadAdminData]
  );

  const registerStudent = useCallback(async (input) => {
    const { errors, data } = validateNewAccount(
      { ...input, role: ROLES.ALUNO },
      []
    );

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    const { data: response, error } = await supabase.functions.invoke(
      'register',
      { body: data }
    );

    if (error) {
      await throwFunctionError(
        error,
        'Não foi possível criar sua conta.'
      );
    }

    if (!response?.profile) {
      throw new AuthError('Não foi possível criar sua conta.');
    }

    return mapProfile(response.profile);
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      profileRequestRef.current += 1;
      clearRememberPreference();
      setSession(null);
      setCurrentUser(null);
      setUsers([]);
      setAuditLog([]);
    }
  }, []);

  const refreshAuditLog = useCallback(async () => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error) {
      setAuditLog((data ?? []).map(mapAuditEntry));
    }
  }, []);

  const createAccount = useCallback(
    async (input) => {
      const { errors, data: validated } = validateNewAccount(input, users);

      if (Object.keys(errors).length > 0) {
        throw new ValidationError(errors);
      }

      const { data, error } = await supabase.functions.invoke(
        'create-member',
        { body: validated }
      );

      if (error) {
        await throwFunctionError(
          error,
          'Não foi possível criar a conta.'
        );
      }

      if (!data?.profile) {
        throw new AuthError('Não foi possível criar a conta.');
      }

      try {
        await refreshAuditLog();
      } catch {
        // Histórico é atualizado na próxima abertura do painel.
      }

      return mapProfile(data.profile);
    },
    [refreshAuditLog, users]
  );

  const manageMember = useCallback(
    async (body, fallback) => {
      const { data, error } = await supabase.functions.invoke(
        'manage-member',
        { body }
      );

      if (error) {
        await throwFunctionError(error, fallback);
      }

      try {
        await refreshAuditLog();
      } catch {
        // Histórico é atualizado na próxima abertura do painel.
      }

      return data;
    },
    [refreshAuditLog]
  );

  const setUserRole = useCallback(
    async (userId, role) => {
      if (role !== ROLES.ADMIN && role !== ROLES.MEMBRO) {
        throw new AuthError('Função inválida.');
      }

      const data = await manageMember(
        { action: 'set_role', userId, role },
        'Não foi possível alterar a função.'
      );

      const updated = data?.profile ? mapProfile(data.profile) : null;

      if (updated) {
        setUsers((list) =>
          list.map((user) => (user.id === updated.id ? updated : user))
        );
      }

      return updated;
    },
    [manageMember]
  );

  const setUserActive = useCallback(
    async (userId, active) => {
      if (typeof active !== 'boolean') {
        throw new AuthError('Estado inválido.');
      }

      const data = await manageMember(
        { action: 'set_active', userId, active },
        'Não foi possível alterar o estado da conta.'
      );

      const updated = data?.profile ? mapProfile(data.profile) : null;

      if (updated) {
        setUsers((list) =>
          list.map((user) => (user.id === updated.id ? updated : user))
        );
      }

      return updated;
    },
    [manageMember]
  );

  const deleteUser = useCallback(
    async (userId) => {
      await manageMember(
        { action: 'delete', userId },
        'Não foi possível excluir a conta.'
      );

      setUsers((list) => list.filter((user) => user.id !== userId));
      return true;
    },
    [manageMember]
  );

  const resetUserPassword = useCallback(
    async (userId) => {
      const data = await manageMember(
        { action: 'reset_password', userId },
        'Não foi possível gerar a senha temporária.'
      );

      if (!data?.temporaryPassword) {
        throw new AuthError('Não foi possível gerar a senha temporária.');
      }

      setUsers((list) =>
        list.map((user) =>
          user.id === userId
            ? { ...user, mustChangePassword: true }
            : user
        )
      );

      return data.temporaryPassword;
    },
    [manageMember]
  );

  const changePassword = useCallback(
    async ({ currentPassword, newPassword, confirmPassword }) => {
      if (!currentUser) {
        throw new AuthError('Sessão expirada. Faça login novamente.');
      }

      const errors = validatePasswordChange({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (Object.keys(errors).length > 0) {
        throw new ValidationError(errors);
      }

      if (String(currentPassword) === String(newPassword)) {
        throw new AuthError(
          'A nova senha precisa ser diferente da senha atual.'
        );
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: String(currentPassword),
      });

      if (reauthError) {
        throw new AuthError('A senha atual está incorreta.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: String(newPassword),
      });

      if (updateError) {
        throw new AuthError(
          updateError.message || 'Não foi possível alterar a senha.'
        );
      }

      const { error: flagError } = await supabase.rpc(
        'mark_password_changed'
      );

      if (flagError) {
        throw new AuthError(
          'A senha foi alterada, mas não foi possível atualizar o perfil.'
        );
      }

      // Invalida syncs em voo que possam ter lido a flag antiga.
      const requestId = profileRequestRef.current + 1;
      profileRequestRef.current = requestId;

      const row = await fetchProfileRow(currentUser.id);

      if (row && requestId === profileRequestRef.current) {
        const profile = mapProfile(row);
        setCurrentUser(profile);
        setUsers((list) =>
          list.map((user) => (user.id === profile.id ? profile : user))
        );
      }

      return true;
    },
    [currentUser]
  );

  const sessionInfo = useMemo(() => {
    if (!session) {
      return null;
    }

    return {
      expiresAt: session.expires_at
        ? session.expires_at * 1000
        : Date.now() + 15 * 60 * 1000,
      remember: getRememberPreference(),
    };
  }, [session]);

  const value = useMemo(
    () => ({
      users,
      currentUser,
      session: sessionInfo,
      auditLog,
      initializing,
      isAdmin: currentUser?.role === ROLES.ADMIN,
      isMember:
        currentUser?.role === ROLES.ADMIN ||
        currentUser?.role === ROLES.MEMBRO,
      login,
      registerStudent,
      logout,
      createAccount,
      setUserRole,
      setUserActive,
      deleteUser,
      resetUserPassword,
      changePassword,
    }),
    [
      auditLog,
      changePassword,
      createAccount,
      currentUser,
      deleteUser,
      initializing,
      login,
      logout,
      registerStudent,
      resetUserPassword,
      sessionInfo,
      setUserActive,
      setUserRole,
      users,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }

  return context;
}
