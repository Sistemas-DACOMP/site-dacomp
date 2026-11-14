import { useEffect, useState } from 'react';
import { LogIn, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Link, useRouter } from '../router/Router';
import { getInitials } from '../lib/utils';

const menuItems = [
  { label: 'Home', href: '#home' },
  { label: 'Notícias', href: '#noticias' },
  { label: 'Eventos', href: '#eventos' },
  { label: 'Aulas', href: '#aulas' },
  { label: 'Materiais', href: '#materiais' },
  { label: 'Gestão', href: '#gestao' },
  { label: 'Contato', href: '#contato' },
];

function scrollToSection(sectionId, attempts = 12) {
  const section = document.getElementById(sectionId);

  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  // A página inicial pode ainda estar renderizando após a navegação.
  if (attempts > 0) {
    window.setTimeout(
      () => scrollToSection(sectionId, attempts - 1),
      60
    );
  }
}

export default function Navbar() {
  const { currentUser } = useAuth();
  const { path, navigate } = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const firstName = currentUser?.nome?.split(' ')[0] ?? '';

  const handleSectionClick = (event, href) => {
    event.preventDefault();
    const sectionId = href.replace('#', '');
    setMenuOpen(false);

    if (path !== '/') {
      navigate('/');
      window.setTimeout(() => scrollToSection(sectionId), 80);
      return;
    }

    scrollToSection(sectionId);
  };

  const openProfile = () => {
    setMenuOpen(false);
    navigate('/perfil');
  };

  const openLogin = () => {
    setMenuOpen(false);
    navigate('/login');
  };

  const handleHamburgerKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setMenuOpen((current) => !current);
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
        <Link
          to="/"
          className="navbar-logo"
          aria-label="DACOMP — página inicial"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/images/logo/Logo DACOMP 2025 - Perfil.png"
            alt="DACOMP Logo"
          />
        </Link>

        <div className="navbar-menu">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={item.href === '#home' ? 'active' : ''}
              onClick={(event) => handleSectionClick(event, item.href)}
            >
              {item.label}
            </a>
          ))}

          {!currentUser ? (
            <Link to="/registrar" className="navbar-register-link">
              Criar conta
            </Link>
          ) : null}

          {currentUser ? (
            <button
              type="button"
              className="navbar-profile-btn"
              onClick={openProfile}
              aria-label={`Abrir perfil de ${currentUser.nome}`}
              title="Meu perfil"
            >
              <span className="navbar-avatar" aria-hidden="true">
                {getInitials(currentUser.nome)}
              </span>
              <span className="navbar-profile-name">{firstName}</span>
            </button>
          ) : (
            <button
              type="button"
              className="navbar-login-btn"
              onClick={openLogin}
              aria-label="Entrar"
            >
              <LogIn size={18} aria-hidden="true" />
              <span>Login</span>
            </button>
          )}
        </div>

        <div
          className={`navbar-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((current) => !current)}
          onKeyDown={handleHamburgerKeyDown}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          role="button"
          tabIndex={0}
        >
          <span />
          <span />
          <span />
        </div>
      </nav>

      <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(event) => handleSectionClick(event, item.href)}
          >
            {item.label}
          </a>
        ))}

        {!currentUser ? (
          <Link
            to="/registrar"
            className="mobile-register-link"
            onClick={() => setMenuOpen(false)}
          >
            Criar conta de aluno
          </Link>
        ) : null}

        {currentUser ? (
          <button
            type="button"
            className="mobile-login-btn"
            onClick={openProfile}
          >
            <span className="navbar-avatar" aria-hidden="true">
              {getInitials(currentUser.nome)}
            </span>
            <span>Meu perfil</span>
          </button>
        ) : (
          <button type="button" className="mobile-login-btn" onClick={openLogin}>
            <UserRound size={20} aria-hidden="true" />
            <span>Login</span>
          </button>
        )}
      </div>
    </>
  );
}
