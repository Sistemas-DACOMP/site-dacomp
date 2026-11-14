import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from '../router/Router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AccessDeniedPage({
  title = 'Acesso restrito',
  message = 'Você não tem permissão para acessar esta área.',
}) {
  useDocumentTitle('Acesso restrito');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao site
        </Link>

        <div className="auth-header">
          <div className="login-logo-wrapper">
            <ShieldAlert size={32} aria-hidden="true" />
          </div>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{message}</p>
        </div>

        <div className="auth-actions-row">
          <Link to="/perfil" className="login-submit-btn">
            Ir para meu perfil
          </Link>
          <Link to="/" className="btn-secondary">
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
