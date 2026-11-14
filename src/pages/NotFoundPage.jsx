import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from '../router/Router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao site
        </Link>

        <div className="auth-header">
          <div className="login-logo-wrapper">
            <Compass size={32} aria-hidden="true" />
          </div>
          <h1 className="auth-title">Página não encontrada</h1>
          <p className="auth-subtitle">
            O endereço acessado não existe ou foi movido.
          </p>
        </div>

        <div className="auth-actions-row">
          <Link to="/" className="login-submit-btn">
            Ir para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
