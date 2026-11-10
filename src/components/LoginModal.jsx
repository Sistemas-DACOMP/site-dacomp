import { useState } from 'react';
import { User, Lock, X, LogIn, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div
        className="login-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button className="login-modal-close" onClick={onClose} aria-label="Fechar">
          <X size={22} />
        </button>

        {/* Modal Header */}
        <div className="login-modal-header">
          <div className="login-logo-wrapper">
            <img
              src="/images/logo/Logo DACOMP 2025 - Perfil.png"
              alt="DACOMP Logo"
              className="login-logo"
            />
          </div>
          <h2 className="login-modal-title">Área do Estudante</h2>
          <p className="login-modal-subtitle">
            Acesse o portal de serviços e eventos do DACOMP UFU
          </p>
        </div>

        {submitted ? (
          <div className="login-success-state">
            <div className="login-success-icon">
              <LogIn size={36} />
            </div>
            <h3>Bem-vindo ao DACOMP!</h3>
            <p>Login realizado com sucesso. Redirecionando...</p>
          </div>
        ) : (
          <form className="login-modal-form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="login-field">
              <label htmlFor="login-email">E-mail ou CPF</label>
              <div className="login-input-wrapper">
                <User className="login-input-icon" size={18} />
                <input
                  id="login-email"
                  type="text"
                  placeholder="aluno@ufu.br ou 000.000.000-00"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="login-password">Senha</label>
                <a href="#forgot" className="login-forgot-link">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="login-input-wrapper">
                <Lock className="login-input-icon" size={18} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Alternar visibilidade da senha"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="login-options-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Lembrar de mim</span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <span className="login-spinner"></span>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* idUFU SSO Button */}
            <div className="login-divider">
              <span>ou continue com</span>
            </div>

            <button type="button" className="login-sso-btn">
              <img
                src="/images/logo/Logo DACOMP 2025 - Perfil.png"
                alt=""
                className="sso-icon"
              />
              <span>Entrar com idUFU</span>
            </button>

            {/* Register Footer */}
            <div className="login-footer">
              <span>Não tem uma conta?</span>{' '}
              <a href="#register" className="login-register-link">
                Cadastre-se
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
