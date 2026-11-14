import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  IdCard,
  Mail,
  User,
  UserPlus,
} from 'lucide-react';
import {
  AuthError,
  ValidationError,
  useAuth,
} from '../auth/AuthContext';
import {
  FormAlert,
  PasswordField,
  PasswordRules,
  TextField,
} from '../components/FormField';
import { Link, useRouter } from '../router/Router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const INITIAL_VALUES = {
  nome: '',
  matricula: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterStudentPage() {
  useDocumentTitle('Criar conta de aluno');

  const { registerStudent, login } = useAuth();
  const { navigate } = useRouter();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setErrors({});
    setFormError('');
    setSubmitting(true);

    try {
      await registerStudent(values);

      try {
        await login({
          identifier: values.email,
          password: values.password,
          remember: false,
        });
        navigate('/perfil', { replace: true });
      } catch {
        navigate('/login?registered=1', { replace: true });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
      } else if (error instanceof AuthError) {
        setFormError(error.message);
      } else {
        setFormError(
          'Não foi possível concluir o cadastro. Tente novamente.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <Link to="/login" className="auth-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Já tenho conta
        </Link>

        <div className="auth-header">
          <div className="login-logo-wrapper">
            <UserPlus size={30} aria-hidden="true" />
          </div>
          <h1 className="auth-title">Criar conta de aluno</h1>
          <p className="auth-subtitle">
            Cadastre-se para acompanhar sua conta no DACOMP. Seu acesso começa
            como aluno e pode ser ampliado por um administrador.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formError ? <FormAlert tone="error">{formError}</FormAlert> : null}

          <FormAlert tone="info">
            Todo cadastro novo entra como <strong>aluno</strong>. O acesso aos
            painéis de membro e administrador é liberado manualmente pela
            diretoria.
          </FormAlert>

          <div className="auth-grid">
            <TextField
              id="student-name"
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
              id="student-matricula"
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
              id="student-username"
              label="Nome de usuário"
              icon={AtSign}
              type="text"
              value={values.username}
              onChange={updateField('username')}
              error={errors.username}
              placeholder="nome.sobrenome"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={32}
              required
            />

            <TextField
              id="student-email"
              label="E-mail"
              icon={Mail}
              className="full"
              type="email"
              value={values.email}
              onChange={updateField('email')}
              error={errors.email}
              placeholder="voce@ufu.br"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              required
            />

            <PasswordField
              id="student-password"
              label="Senha"
              value={values.password}
              onChange={updateField('password')}
              error={errors.password}
              autoComplete="new-password"
              maxLength={128}
              required
            />

            <PasswordField
              id="student-confirm-password"
              label="Confirmar senha"
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

        <div className="auth-footer-note">
          <p>
            Já tem uma conta?{' '}
            <Link to="/login" className="login-register-link">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
