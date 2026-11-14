import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  CheckCircle2,
  Copy,
  IdCard,
  KeyRound,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import {
  AuthError,
  ValidationError,
  useAuth,
} from '../auth/AuthContext';
import { generateTemporaryPassword } from '../lib/password';
import { ROLES } from '../auth/validation';
import {
  FormAlert,
  PasswordField,
  PasswordRules,
  TextField,
} from '../components/FormField';
import { Link, useRouter } from '../router/Router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  buildCredentialsText,
  copyText,
  formatDate,
  roleLabel,
} from '../lib/utils';

const INITIAL_VALUES = {
  nome: '',
  matricula: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ROLES.MEMBRO,
};

export default function RegisterPage() {
  useDocumentTitle('Cadastrar conta');

  const { createAccount } = useAuth();
  const { navigate } = useRouter();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [confirmedMember, setConfirmedMember] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createdAccount, setCreatedAccount] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  const updateField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');

    if (field === 'password' || field === 'confirmPassword') {
      setGeneratedPassword('');
    }
  };

  const handleGeneratePassword = () => {
    const temporaryPassword = generateTemporaryPassword();
    setValues((current) => ({
      ...current,
      password: temporaryPassword,
      confirmPassword: temporaryPassword,
    }));
    setErrors((current) => ({
      ...current,
      password: undefined,
      confirmPassword: undefined,
    }));
    setFormError('');
    setGeneratedPassword(temporaryPassword);
  };

  const handleCopyGeneratedPassword = async () => {
    const copied = await copyText(generatedPassword);
    setCopyFeedback(
      copied
        ? 'Senha copiada para a área de transferência.'
        : 'Não foi possível copiar automaticamente. Selecione e copie manualmente.'
    );
  };

  const handleCopyCredentials = async () => {
    if (!createdAccount) {
      return;
    }

    const copied = await copyText(
      buildCredentialsText(createdAccount, createdAccount.password)
    );
    setCopyFeedback(
      copied
        ? 'Credenciais copiadas para a área de transferência.'
        : 'Não foi possível copiar automaticamente. Selecione e copie manualmente.'
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!confirmedMember) {
      setFormError(
        'Confirme que a pessoa é membro do DACOMP e que você tem autorização para criar a conta.'
      );
      return;
    }

    setErrors({});
    setFormError('');
    setSubmitting(true);

    try {
      const passwordForDisplay = values.password;
      const account = await createAccount(values);

      setCreatedAccount({ ...account, password: passwordForDisplay });
      setValues(INITIAL_VALUES);
      setConfirmedMember(false);
      setGeneratedPassword('');
      setCopyFeedback('');
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
      } else if (error instanceof AuthError) {
        setFormError(error.message);
      } else {
        setFormError('Não foi possível criar a conta. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (createdAccount) {
    return (
      <div className="auth-page">
        <div className="auth-card wide">
          <Link to="/admin" className="auth-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar ao painel administrativo
          </Link>

          <div className="auth-header">
            <div className="login-success-icon">
              <CheckCircle2 size={34} aria-hidden="true" />
            </div>
            <h1 className="auth-title">Conta criada com sucesso</h1>
            <p className="auth-subtitle">
              Entregue as credenciais abaixo por um canal seguro. A senha
              temporária será exigida apenas no primeiro acesso.
            </p>
          </div>

          <div className="profile-meta">
            <div className="meta-item">
              <span className="meta-label">Nome</span>
              <span className="meta-value">{createdAccount.nome}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Matrícula</span>
              <span className="meta-value">{createdAccount.matricula}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Usuário</span>
              <span className="meta-value">{createdAccount.username}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">E-mail</span>
              <span className="meta-value">{createdAccount.email}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Função</span>
              <span className="meta-value">
                {roleLabel(createdAccount.role)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Criada em</span>
              <span className="meta-value">
                {formatDate(createdAccount.createdAt)}
              </span>
            </div>
          </div>

          <div className="credential-box">
            <div>
              <span className="credential-label">Senha temporária</span>
              <code>{createdAccount.password}</code>
            </div>
            <button
              type="button"
              className="icon-text-btn"
              onClick={handleCopyCredentials}
            >
              <Copy size={16} aria-hidden="true" />
              Copiar credenciais
            </button>
          </div>

          {copyFeedback ? (
            <FormAlert tone="info">{copyFeedback}</FormAlert>
          ) : null}

          <FormAlert tone="info">
            No primeiro acesso, o membro será obrigado a definir uma nova
            senha. A senha temporária não pode ser consultada novamente depois
            que você sair desta tela.
          </FormAlert>

          <div className="auth-actions-row">
            <button
              type="button"
              className="login-submit-btn"
              onClick={() => {
                setCreatedAccount(null);
                setCopyFeedback('');
              }}
            >
              <UserPlus size={18} aria-hidden="true" />
              Cadastrar outra conta
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/admin')}
            >
              Ir para o painel administrativo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <Link to="/admin" className="auth-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao painel administrativo
        </Link>

        <div className="auth-header">
          <div className="login-logo-wrapper">
            <UserPlus size={30} aria-hidden="true" />
          </div>
          <h1 className="auth-title">Cadastrar conta</h1>
          <p className="auth-subtitle">
            Área exclusiva dos administradores do DACOMP. Crie a conta e defina
            se ela começa como aluno, membro do DA ou administrador.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formError ? <FormAlert tone="error">{formError}</FormAlert> : null}

          <FormAlert tone="info">
            Use <strong>Aluno</strong> para cadastros gerais. Use{' '}
            <strong>Membro</strong> ou <strong>Administrador</strong> apenas
            para integrantes autorizados do DACOMP.
          </FormAlert>

          <div className="auth-grid">
            <TextField
              id="register-name"
              label="Nome completo"
              icon={User}
              className="full"
              type="text"
              value={values.nome}
              onChange={updateField('nome')}
              error={errors.nome}
              autoComplete="name"
              maxLength={120}
              required
            />

            <TextField
              id="register-matricula"
              label="Matrícula"
              icon={IdCard}
              type="text"
              inputMode="text"
              value={values.matricula}
              onChange={updateField('matricula')}
              error={errors.matricula}
              placeholder="12411BSI224"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={20}
              required
            />

            <TextField
              id="register-username"
              label="Nome de usuário"
              icon={AtSign}
              type="text"
              value={values.username}
              onChange={updateField('username')}
              error={errors.username}
              placeholder="nome.sobrenome"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={32}
              required
            />

            <TextField
              id="register-email"
              label="E-mail"
              icon={Mail}
              className="full"
              type="email"
              value={values.email}
              onChange={updateField('email')}
              error={errors.email}
              placeholder="membro@ufu.br"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              required
            />

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="register-role">Função</label>
              </div>
              <div className="login-input-wrapper select-wrapper">
                <ShieldCheck className="login-input-icon" size={18} />
                <select
                  id="register-role"
                  value={values.role}
                  onChange={updateField('role')}
                >
                  <option value={ROLES.ALUNO}>Aluno</option>
                  <option value={ROLES.MEMBRO}>Membro do DA</option>
                  <option value={ROLES.ADMIN}>Administrador</option>
                </select>
              </div>
              <span className="field-hint">
                Aluno: apenas o próprio perfil. Membro: painel e gestão geral.
                Admin: acesso total, incluindo contas.
              </span>
            </div>

            <div className="login-field password-generator-field">
              <span className="field-hint">
                Defina uma senha temporária segura ou gere uma automaticamente.
              </span>
              <button
                type="button"
                className="inline-text-btn"
                onClick={handleGeneratePassword}
              >
                <KeyRound size={14} aria-hidden="true" />
                Gerar senha forte
              </button>
            </div>

            <PasswordField
              id="register-password"
              label="Senha temporária"
              value={values.password}
              onChange={updateField('password')}
              error={errors.password}
              autoComplete="new-password"
              maxLength={128}
              required
            />

            <PasswordField
              id="register-confirm-password"
              label="Confirmar senha temporária"
              value={values.confirmPassword}
              onChange={updateField('confirmPassword')}
              error={errors.confirmPassword}
              autoComplete="new-password"
              maxLength={128}
              required
            />

            <div className="full">
              <PasswordRules password={values.password} />
            </div>
          </div>

          {generatedPassword ? (
            <div className="credential-box">
              <div>
                <span className="credential-label">Senha gerada</span>
                <code>{generatedPassword}</code>
              </div>
              <button
                type="button"
                className="icon-text-btn"
                onClick={handleCopyGeneratedPassword}
              >
                <Copy size={16} aria-hidden="true" />
                Copiar
              </button>
            </div>
          ) : null}

          {copyFeedback ? (
            <FormAlert tone="info">{copyFeedback}</FormAlert>
          ) : null}

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={confirmedMember}
              onChange={(event) => {
                setConfirmedMember(event.target.checked);
                setFormError('');
              }}
            />
            <span>
              Confirmo que tenho autorização para criar esta conta e que a
              função escolhida está correta.
            </span>
          </label>

          <FormAlert tone="info">
            A senha inicial é armazenada como hash pelo Supabase Auth. No
            primeiro acesso, o membro deverá definir uma nova senha antes de
            usar os painéis.
          </FormAlert>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <span className="login-spinner" aria-label="Criando conta" />
            ) : (
              <>
                <UserPlus size={18} aria-hidden="true" />
                <span>Criar conta</span>
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
