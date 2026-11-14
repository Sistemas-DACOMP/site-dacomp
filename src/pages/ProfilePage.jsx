import { useState } from 'react';
import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import {
  AuthError,
  ValidationError,
  useAuth,
} from '../auth/AuthContext';
import { ROLES } from '../auth/validation';
import {
  FormAlert,
  PasswordField,
  PasswordRules,
} from '../components/FormField';
import { Link, useRouter } from '../router/Router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  formatDate,
  formatDateTime,
  getInitials,
  roleLabel,
} from '../lib/utils';

const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ProfilePage() {
  useDocumentTitle('Meu perfil');

  const {
    currentUser,
    isAdmin,
    isMember,
    session,
    changePassword,
    logout,
  } = useAuth();
  const { navigate } = useRouter();

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) {
    return null;
  }

  const updatePasswordField = (field) => (event) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
    setSuccessMessage('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setErrors({});
    setFormError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      await changePassword(passwordForm);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setSuccessMessage(
        'Senha alterada com sucesso. Guarde a nova senha em local seguro.'
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
      } else if (error instanceof AuthError) {
        setFormError(error.message);
      } else {
        setFormError('Não foi possível alterar a senha. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canOpenPanels = !currentUser.mustChangePassword;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-card profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {getInitials(currentUser.nome)}
          </div>

          <div className="profile-identity">
            <h1 className="profile-name">{currentUser.nome}</h1>
            <div className="profile-badges">
              <span className={`role-badge ${currentUser.role}`}>
                {roleLabel(currentUser.role)}
              </span>
              <span className="status-pill active">Conta ativa</span>
            </div>
            <p className="profile-subtitle">
              Área pessoal do DACOMP. Seus dados de acesso ficam disponíveis
              apenas para você e para os administradores.
            </p>
          </div>

          <div className="profile-header-actions">
            <button type="button" className="btn-ghost" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              Sair
            </button>
          </div>
        </header>

        {currentUser.mustChangePassword ? (
          <FormAlert tone="info">
            Este é seu primeiro acesso. Defina uma nova senha abaixo para
            liberar os painéis internos do DACOMP.
          </FormAlert>
        ) : null}

        <section className="profile-card">
          <h2 className="section-title">Dados da conta</h2>
          <div className="profile-meta">
            <div className="meta-item">
              <span className="meta-label">Matrícula</span>
              <span className="meta-value">{currentUser.matricula}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Usuário</span>
              <span className="meta-value">@{currentUser.username}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">E-mail</span>
              <span className="meta-value">{currentUser.email}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Membro desde</span>
              <span className="meta-value">
                {formatDate(currentUser.createdAt)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Último acesso</span>
              <span className="meta-value">
                {formatDateTime(currentUser.lastLoginAt)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Sessão</span>
              <span className="meta-value">
                {session
                  ? `Expira em ${formatDateTime(session.expiresAt)}`
                  : 'Sessão local'}
              </span>
            </div>
          </div>
        </section>

        <section className="profile-card">
          <h2 className="section-title">Painéis internos</h2>
          <p className="section-description">
            {currentUser.role === ROLES.ALUNO
              ? 'Contas de aluno não acessam os painéis internos do DACOMP.'
              : isMember
                ? 'Como membro do DACOMP, você tem acesso ao painel interno.'
                : 'O acesso aos painéis é restrito aos membros e administradores.'}
          </p>

          {currentUser.role === ROLES.ALUNO ? (
            <FormAlert tone="info">
              Sua conta é de aluno. Um administrador do DACOMP precisa aprovar
              seu acesso como membro para liberar os painéis internos.
            </FormAlert>
          ) : canOpenPanels ? (
            <div className="profile-actions">
              {isMember ? (
                <Link to="/painel-membro" className="panel-launch-btn">
                  <LayoutDashboard size={20} aria-hidden="true" />
                  Abrir Painel do Membro
                </Link>
              ) : null}

              {isAdmin ? (
                <Link
                  to="/admin"
                  className="panel-launch-btn admin"
                >
                  <ShieldCheck size={20} aria-hidden="true" />
                  Abrir Painel Administrativo
                </Link>
              ) : null}
            </div>
          ) : (
            <FormAlert tone="info">
              Os painéis serão liberados depois que você definir uma nova
              senha.
            </FormAlert>
          )}
        </section>

        <section className="profile-card">
          <h2 className="section-title">Alterar senha</h2>
          <p className="section-description">
            Use uma senha exclusiva para o DACOMP. O sistema exige letras
            maiúsculas e minúsculas, número e caractere especial.
          </p>

          <form
            className="auth-form"
            onSubmit={handleChangePassword}
            noValidate
          >
            {formError ? <FormAlert tone="error">{formError}</FormAlert> : null}
            {successMessage ? (
              <FormAlert tone="success">{successMessage}</FormAlert>
            ) : null}

            <PasswordField
              id="profile-current-password"
              label="Senha atual"
              value={passwordForm.currentPassword}
              onChange={updatePasswordField('currentPassword')}
              error={errors.currentPassword}
              autoComplete="current-password"
              maxLength={128}
              required
            />

            <div className="auth-grid">
              <PasswordField
                id="profile-new-password"
                label="Nova senha"
                value={passwordForm.newPassword}
                onChange={updatePasswordField('newPassword')}
                error={errors.newPassword}
                autoComplete="new-password"
                maxLength={128}
                required
              />

              <PasswordField
                id="profile-confirm-password"
                label="Confirmar nova senha"
                value={passwordForm.confirmPassword}
                onChange={updatePasswordField('confirmPassword')}
                error={errors.confirmPassword}
                autoComplete="new-password"
                maxLength={128}
                required
              />
            </div>

            <PasswordRules password={passwordForm.newPassword} />

            <button
              type="submit"
              className="login-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <span className="login-spinner" aria-label="Salvando senha" />
              ) : (
                <>
                  <KeyRound size={17} aria-hidden="true" />
                  <span>Salvar nova senha</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
