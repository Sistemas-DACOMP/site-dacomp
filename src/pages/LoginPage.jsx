import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { FormAlert, PasswordField, TextField } from '../components/FormField';
import { getSafeNextPath, Link, useRouter } from '../router/Router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function LoginPage() {
  useDocumentTitle('Entrar');

  const { login } = useAuth();
  const { navigate } = useRouter();
  const nextPath = useMemo(() => getSafeNextPath(), []);
  const justRegistered = useMemo(() => {
    try {
      return (
        new URLSearchParams(window.location.search).get('registered') === '1'
      );
    } catch {
      return false;
    }
  }, []);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      await login({ identifier, password, remember });
      navigate(nextPath, { replace: true });
    } catch (error) {
      setFormError(
        error?.message || 'Não foi possível entrar. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao site
        </Link>

        <div className="auth-header">
          <div className="login-logo-wrapper">
            <img
              src="/images/logo/Logo DACOMP 2025 - Perfil.png"
              alt=""
              aria-hidden="true"
              className="login-logo"
            />
          </div>
          <h1 className="auth-title">Área do Estudante</h1>
          <p className="auth-subtitle">
            Entre com sua matrícula, nome de usuário ou e-mail para acessar as
            áreas internas do DACOMP.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {justRegistered ? (
            <FormAlert tone="success">
              Conta criada com sucesso. Entre com seu e-mail, usuário ou
              matrícula.
            </FormAlert>
          ) : null}
          {formError ? <FormAlert tone="error">{formError}</FormAlert> : null}

          <TextField
            id="login-identifier"
            label="Matrícula, usuário ou e-mail"
            icon={User}
            type="text"
            placeholder="12411BSI224, usuario ou aluno@ufu.br"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setFormError('');
            }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            required
          />

          <PasswordField
            id="login-password"
            label="Senha"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFormError('');
            }}
            autoComplete="current-password"
            maxLength={128}
            required
            labelAction={
              <span className="login-help-text">
                Esqueceu a senha? Fale com um administrador.
              </span>
            }
          />

          <div className="login-options-row">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Manter sessão neste dispositivo</span>
            </label>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <span className="login-spinner" aria-label="Entrando" />
            ) : (
              <>
                <Lock size={17} aria-hidden="true" />
                <span>Entrar</span>
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-note">
          <ShieldCheck size={16} aria-hidden="true" />
          <p>
            Não tem conta?{' '}
            <Link to="/registrar" className="login-register-link">
              Crie uma conta de aluno
            </Link>
            . O acesso como membro do DA é liberado manualmente por um
            administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
