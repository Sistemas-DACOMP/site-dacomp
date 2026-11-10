import { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import LoginModal from './LoginModal';

const menuItems = [
  { label: 'Home', href: '#home' },
  { label: 'Notícias', href: '#noticias' },
  { label: 'Eventos', href: '#eventos' },
  { label: 'Aulas', href: '#aulas' },
  { label: 'Materiais', href: '#materiais' },
  { label: 'Gestão', href: '#gestao' },
  { label: 'Contato', href: '#contato' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu or login modal is open
  useEffect(() => {
    if (menuOpen || loginOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, loginOpen]);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
        <a href="#home" className="navbar-logo">
          <img
            src="/images/logo/Logo DACOMP 2025 - Perfil.png"
            alt="DACOMP Logo"
          />
        </a>

        <div className="navbar-menu">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={item.href === '#home' ? 'active' : ''}
            >
              {item.label}
            </a>
          ))}
          <button
            className="navbar-login-btn"
            onClick={() => setLoginOpen(true)}
            aria-label="Entrar"
          >
            <LogIn size={18} />
            <span>Login</span>
          </button>
        </div>

        <div
          className={`navbar-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          role="button"
          tabIndex={0}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </nav>

      <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
          >
            {item.label}
          </a>
        ))}
        <button
          className="mobile-login-btn"
          onClick={() => {
            setMenuOpen(false);
            setLoginOpen(true);
          }}
        >
          <LogIn size={20} />
          <span>Login</span>
        </button>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
