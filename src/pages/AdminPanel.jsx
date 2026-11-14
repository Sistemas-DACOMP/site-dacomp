import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  GraduationCap,
  History,
  KeyRound,
  Power,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../auth/validation';
import { FormAlert } from '../components/FormField';
import { Link } from '../router/Router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  buildCredentialsText,
  copyText,
  formatDateTime,
  getInitials,
  roleLabel,
} from '../lib/utils';

const AUDIT_LABELS = {
  'auth.login': 'Login realizado',
  'account.setup_admin': 'Administrador inicial criado',
  'account.created': 'Conta criada',
  'account.self_registered': 'Cadastro público de aluno',
  'account.role_changed': 'Função alterada',
  'account.activated': 'Conta reativada',
  'account.deactivated': 'Conta desativada',
  'account.deleted': 'Conta excluída',
  'account.password_reset': 'Senha temporária gerada',
  'account.password_changed': 'Senha alterada',
};

export default function AdminPanel() {
  useDocumentTitle('Painel Administrativo');

  const {
    users,
    currentUser,
    auditLog,
    setUserRole,
    setUserActive,
    deleteUser,
    resetUserPassword,
  } = useAuth();

  const [query, setQuery] = useState('');
  const [busyUserId, setBusyUserId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [resetDialog, setResetDialog] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    if (!resetDialog) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setResetDialog(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetDialog]);

  const stats = useMemo(
    () => ({
      total: users.length,
      alunos: users.filter((user) => user.role === ROLES.ALUNO).length,
      membros: users.filter((user) => user.role === ROLES.MEMBRO).length,
      admins: users.filter((user) => user.role === ROLES.ADMIN).length,
      ativos: users.filter((user) => user.active).length,
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...users]
      .sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
      .filter((user) => {
        if (!normalizedQuery) {
          return true;
        }

        return [user.nome, user.username, user.email, user.matricula].some(
          (value) => String(value).toLowerCase().includes(normalizedQuery)
        );
      });
  }, [query, users]);

  const userById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users]
  );

  const runAction = async (userId, operation, successMessage) => {
    if (busyUserId) {
      return;
    }

    setBusyUserId(userId);
    setActionError('');
    setActionMessage('');

    try {
      await operation();
      setActionMessage(successMessage);
    } catch (error) {
      setActionError(
        error?.message || 'Não foi possível concluir a operação.'
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRoleChange = (user, event) => {
    const nextRole = event.target.value;

    if (nextRole === user.role) {
      return;
    }

    const confirmation = `Alterar a função de ${user.nome} para ${roleLabel(nextRole)}?`;

    if (!window.confirm(confirmation)) {
      event.target.value = user.role;
      return;
    }

    runAction(
      user.id,
      () => setUserRole(user.id, nextRole),
      `Função de ${user.nome} alterada para ${roleLabel(nextRole)}.`
    );
  };

  const handleToggleActive = (user) => {
    const nextActive = !user.active;
    const confirmation = nextActive
      ? `Reativar a conta de ${user.nome}?`
      : `Desativar a conta de ${user.nome}? A pessoa perderá o acesso imediatamente.`;

    if (!window.confirm(confirmation)) {
      return;
    }

    runAction(
      user.id,
      () => setUserActive(user.id, nextActive),
      nextActive
        ? `Conta de ${user.nome} reativada.`
        : `Conta de ${user.nome} desativada.`
    );
  };

  const handleDelete = (user) => {
    const confirmation = `Excluir definitivamente a conta de ${user.nome}? Esta ação não pode ser desfeita.`;

    if (!window.confirm(confirmation)) {
      return;
    }

    runAction(
      user.id,
      () => deleteUser(user.id),
      `Conta de ${user.nome} excluída.`
    );
  };

  const handleResetPassword = async (user) => {
    const confirmation = `Gerar uma nova senha temporária para ${user.nome}? A senha atual deixará de funcionar.`;

    if (!window.confirm(confirmation) || busyUserId) {
      return;
    }

    setBusyUserId(user.id);
    setActionError('');
    setActionMessage('');
    setCopyFeedback('');

    try {
      const temporaryPassword = await resetUserPassword(user.id);
      setResetDialog({ user, password: temporaryPassword });
      setActionMessage(`Nova senha temporária gerada para ${user.nome}.`);
    } catch (error) {
      setActionError(
        error?.message || 'Não foi possível redefinir a senha.'
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleCopyResetCredentials = async () => {
    if (!resetDialog) {
      return;
    }

    const copied = await copyText(
      buildCredentialsText(resetDialog.user, resetDialog.password)
    );

    setCopyFeedback(
      copied
        ? 'Credenciais copiadas para a área de transferência.'
        : 'Não foi possível copiar automaticamente. Selecione e copie manualmente.'
    );
  };

  const renderUserActions = (user, isSelf, isBusy) => (
    <div className="admin-actions">
      <button
        type="button"
        className="admin-icon-btn"
        onClick={() => handleToggleActive(user)}
        disabled={isSelf || isBusy}
        title={
          isSelf
            ? 'Você não pode desativar a própria conta'
            : user.active
              ? 'Desativar conta'
              : 'Reativar conta'
        }
        aria-label={`${
          user.active ? 'Desativar' : 'Reativar'
        } conta de ${user.nome}`}
      >
        <Power size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="admin-icon-btn"
        onClick={() => handleResetPassword(user)}
        disabled={isSelf || isBusy}
        title={
          isSelf
            ? 'Altere sua senha pelo perfil'
            : 'Gerar nova senha temporária'
        }
        aria-label={`Gerar nova senha temporária para ${user.nome}`}
      >
        <KeyRound size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="admin-icon-btn danger"
        onClick={() => handleDelete(user)}
        disabled={isSelf || isBusy}
        title={
          isSelf
            ? 'Você não pode excluir a própria conta'
            : 'Excluir conta'
        }
        aria-label={`Excluir conta de ${user.nome}`}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );

  if (!currentUser) {
    return null;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <Link to="/perfil" className="auth-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao perfil
        </Link>

        <header className="dashboard-header">
          <div className="dashboard-identity">
            <div className="profile-avatar small" aria-hidden="true">
              {getInitials(currentUser.nome)}
            </div>
            <div>
              <span className="dashboard-eyebrow">Administração</span>
              <h1 className="dashboard-title">Painel Administrativo</h1>
              <p className="dashboard-subtitle">
                Cadastre e gerencie o acesso dos membros do DACOMP.
              </p>
            </div>
          </div>

          <div className="dashboard-header-actions">
            <Link to="/cadastro" className="panel-launch-btn admin">
              <UserPlus size={18} aria-hidden="true" />
              Cadastrar membro
            </Link>
            <Link to="/perfil" className="btn-ghost">
              Meu perfil
            </Link>
          </div>
        </header>

        {actionError ? <FormAlert tone="error">{actionError}</FormAlert> : null}
        {actionMessage ? (
          <FormAlert tone="success">{actionMessage}</FormAlert>
        ) : null}

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">
              <Users size={18} aria-hidden="true" />
            </span>
            <span className="stat-label">Total de contas</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <span className="stat-label">Administradores</span>
            <span className="stat-value">{stats.admins}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <UserCog size={18} aria-hidden="true" />
            </span>
            <span className="stat-label">Membros do DA</span>
            <span className="stat-value">{stats.membros}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <GraduationCap size={18} aria-hidden="true" />
            </span>
            <span className="stat-label">Alunos</span>
            <span className="stat-value">{stats.alunos}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <Power size={18} aria-hidden="true" />
            </span>
            <span className="stat-label">Contas ativas</span>
            <span className="stat-value">{stats.ativos}</span>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-card-header">
            <div>
              <h2>Contas cadastradas</h2>
              <p className="section-description">
                Cadastros públicos entram como aluno e podem ser aprovados
                aqui. Contas criadas manualmente recebem uma senha temporária.
              </p>
            </div>
            <Link to="/cadastro" className="panel-launch-btn admin small">
              <UserPlus size={16} aria-hidden="true" />
              Nova conta
            </Link>
          </div>

          <div className="admin-toolbar">
            <label className="admin-search" htmlFor="admin-search-input">
              <Search size={18} aria-hidden="true" />
              <input
                id="admin-search-input"
                type="search"
                placeholder="Buscar por nome, matrícula, usuário ou e-mail"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
            </label>
            <span className="admin-count">
              {filteredUsers.length} de {users.length}
            </span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <Users size={24} aria-hidden="true" />
              <p>Nenhuma conta encontrada.</p>
              <span>
                {users.length === 0
                  ? 'Cadastre o primeiro membro para liberar o acesso ao painel.'
                  : 'Tente ajustar os termos da busca.'}
              </span>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Pessoa</th>
                    <th scope="col">Matrícula</th>
                    <th scope="col">E-mail</th>
                    <th scope="col">Função</th>
                    <th scope="col">Status</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUser.id;
                    const isBusy = busyUserId === user.id;

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <strong>
                              {user.nome}
                              {isSelf ? (
                                <span className="you-tag">você</span>
                              ) : null}
                            </strong>
                            <span>@{user.username}</span>
                          </div>
                        </td>
                        <td>{user.matricula}</td>
                        <td className="break-cell">{user.email}</td>
                        <td>
                          {isSelf ? (
                            <span className={`role-badge ${user.role}`}>
                              {roleLabel(user.role)}
                            </span>
                          ) : (
                            <select
                              className="role-select"
                              value={user.role}
                              onChange={(event) =>
                                handleRoleChange(user, event)
                              }
                              disabled={isBusy}
                              aria-label={`Função de ${user.nome}`}
                            >
                              <option value={ROLES.ALUNO}>Aluno</option>
                              <option value={ROLES.MEMBRO}>Membro</option>
                              <option value={ROLES.ADMIN}>
                                Administrador
                              </option>
                            </select>
                          )}
                        </td>
                        <td>
                          <span
                            className={`status-dot ${
                              user.active ? '' : 'inactive'
                            }`}
                          >
                            {user.active ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td>{renderUserActions(user, isSelf, isBusy)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>

              <div className="admin-mobile-list">
                {filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser.id;
                  const isBusy = busyUserId === user.id;

                  return (
                    <article className="admin-mobile-card" key={user.id}>
                      <div className="admin-mobile-head">
                        <div className="user-cell">
                          <strong>
                            {user.nome}
                            {isSelf ? (
                              <span className="you-tag">você</span>
                            ) : null}
                          </strong>
                          <span>@{user.username}</span>
                        </div>
                        <span
                          className={`status-dot ${
                            user.active ? '' : 'inactive'
                          }`}
                        >
                          {user.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>

                      <div className="admin-mobile-meta">
                        <span>
                          Matrícula <strong>{user.matricula}</strong>
                        </span>
                        <span>
                          E-mail <strong>{user.email}</strong>
                        </span>
                      </div>

                      <div className="admin-mobile-role">
                        <span className={`role-badge ${user.role}`}>
                          {roleLabel(user.role)}
                        </span>
                        {!isSelf ? (
                          <select
                            className="role-select"
                            value={user.role}
                            onChange={(event) =>
                              handleRoleChange(user, event)
                            }
                            disabled={isBusy}
                            aria-label={`Função de ${user.nome}`}
                          >
                            <option value={ROLES.ALUNO}>Aluno</option>
                            <option value={ROLES.MEMBRO}>Membro</option>
                            <option value={ROLES.ADMIN}>
                              Administrador
                            </option>
                          </select>
                        ) : null}
                      </div>

                      {renderUserActions(user, isSelf, isBusy)}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-header-with-icon">
              <span className="panel-card-icon">
                <History size={18} aria-hidden="true" />
              </span>
              <h2>Histórico administrativo</h2>
            </div>
            <span className="admin-count">Últimos 12 registros</span>
          </div>

          {auditLog.length === 0 ? (
            <div className="empty-state">
              <History size={24} aria-hidden="true" />
              <p>Nenhuma atividade registrada.</p>
              <span>
                Criações, alterações de função e exclusões aparecerão aqui.
              </span>
            </div>
          ) : (
            <ul className="audit-list">
              {auditLog.slice(0, 12).map((entry) => {
                const actor = userById.get(entry.actorId);

                return (
                  <li key={entry.id}>
                    <div className="audit-entry-main">
                      <strong>
                        {AUDIT_LABELS[entry.action] ?? entry.action}
                      </strong>
                      <span>
                        {entry.details ? `${entry.details} — ` : ''}
                        por {actor?.nome ?? 'sistema'}
                      </span>
                    </div>
                    <time dateTime={entry.at}>
                      {formatDateTime(entry.at)}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="panel-footnote">
          As ações administrativas ficam registradas no banco do DACOMP e o
          histórico é visível apenas para administradores.
        </p>
      </div>

      {resetDialog ? (
        <div
          className="dialog-overlay"
          onClick={() => setResetDialog(null)}
          role="presentation"
        >
          <div
            className="dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="login-modal-close"
              onClick={() => setResetDialog(null)}
              aria-label="Fechar"
            >
              <X size={22} />
            </button>

            <div className="auth-header">
              <div className="login-success-icon">
                <KeyRound size={30} aria-hidden="true" />
              </div>
              <h2 id="reset-password-title" className="auth-title">
                Nova senha temporária
              </h2>
              <p className="auth-subtitle">
                Entregue a senha abaixo para {resetDialog.user.nome} por um
                canal seguro.
              </p>
            </div>

            <div className="credential-box">
              <div>
                <span className="credential-label">Senha temporária</span>
                <code>{resetDialog.password}</code>
              </div>
              <button
                type="button"
                className="icon-text-btn"
                onClick={handleCopyResetCredentials}
              >
                <Copy size={16} aria-hidden="true" />
                Copiar credenciais
              </button>
            </div>

            {copyFeedback ? (
              <FormAlert tone="info">{copyFeedback}</FormAlert>
            ) : null}

            <FormAlert tone="info">
              A pessoa deverá definir uma nova senha no próximo acesso. Esta
              senha não poderá ser consultada novamente depois de fechar o
              aviso.
            </FormAlert>

            <div className="auth-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setResetDialog(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
