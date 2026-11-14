import { AuthProvider, useAuth } from './auth/AuthContext';
import Navbar from './components/Navbar';
import { Navigate, RouterProvider, useRouter } from './router/Router';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterStudentPage from './pages/RegisterStudentPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MemberPanel from './pages/MemberPanel';
import AdminPanel from './pages/AdminPanel';
import AccessDeniedPage from './pages/AccessDeniedPage';
import NotFoundPage from './pages/NotFoundPage';

function LoadingScreen() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="login-logo-wrapper">
            <span className="login-spinner" aria-label="Carregando" />
          </div>
          <h1 className="auth-title">Carregando…</h1>
          <p className="auth-subtitle">Verificando sua sessão.</p>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { path } = useRouter();
  const { currentUser, isAdmin, isMember, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (path === '/') {
    return <HomePage />;
  }

  if (path === '/registrar') {
    if (currentUser) {
      return <Navigate to="/perfil" replace />;
    }

    return <RegisterStudentPage />;
  }

  if (path === '/login') {
    if (currentUser) {
      return <Navigate to="/perfil" replace />;
    }

    return <LoginPage />;
  }

  if (path === '/perfil') {
    if (!currentUser) {
      return <Navigate to="/login?next=%2Fperfil" replace />;
    }

    return <ProfilePage />;
  }

  if (path === '/painel-membro') {
    if (!currentUser) {
      return <Navigate to="/login?next=%2Fpainel-membro" replace />;
    }

    if (!isMember) {
      return (
        <AccessDeniedPage
          title="Painel do membro"
          message="Esta área é exclusiva para membros do DACOMP. Se você acredita que deveria ter acesso, procure a diretoria."
        />
      );
    }

    if (currentUser.mustChangePassword) {
      return <Navigate to="/perfil" replace />;
    }

    return <MemberPanel />;
  }

  if (path === '/admin' || path === '/cadastro') {
    if (!currentUser) {
      return (
        <Navigate to={`/login?next=${encodeURIComponent(path)}`} replace />
      );
    }

    if (!isAdmin) {
      return (
        <AccessDeniedPage
          title="Acesso restrito a administradores"
          message="O cadastro e a gestão de contas são realizados exclusivamente pelos administradores do DACOMP."
        />
      );
    }

    if (currentUser.mustChangePassword) {
      return <Navigate to="/perfil" replace />;
    }

    return path === '/admin' ? <AdminPanel /> : <RegisterPage />;
  }

  return <NotFoundPage />;
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </RouterProvider>
  );
}
