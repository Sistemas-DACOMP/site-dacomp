import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Megaphone,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../auth/supabaseClient';
import { FormAlert } from '../components/FormField';
import { Link } from '../router/Router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatDateTime, getInitials, roleLabel } from '../lib/utils';

const EMPTY_NOTICE = { title: '', body: '' };

export default function MemberPanel() {
  useDocumentTitle('Painel do Membro');

  const { currentUser } = useAuth();

  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [noticeError, setNoticeError] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeForm, setNoticeForm] = useState(EMPTY_NOTICE);
  const [editingId, setEditingId] = useState(null);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);

  const loadNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setNoticeError('Não foi possível carregar os avisos internos.');
    } else {
      setNotices(data ?? []);
      setNoticeError('');
    }

    setNoticesLoading(false);
  };

  useEffect(() => {
    void loadNotices();
  }, []);

  if (!currentUser) {
    return null;
  }

  const startCreateNotice = () => {
    setNoticeForm(EMPTY_NOTICE);
    setEditingId(null);
    setShowNoticeForm(true);
    setNoticeError('');
    setNoticeMessage('');
  };

  const startEditNotice = (notice) => {
    setNoticeForm({ title: notice.title, body: notice.body });
    setEditingId(notice.id);
    setShowNoticeForm(true);
    setNoticeError('');
    setNoticeMessage('');
  };

  const cancelNoticeForm = () => {
    setNoticeForm(EMPTY_NOTICE);
    setEditingId(null);
    setShowNoticeForm(false);
  };

  const handleNoticeSubmit = async (event) => {
    event.preventDefault();

    if (noticeSubmitting) {
      return;
    }

    const title = noticeForm.title.trim();
    const body = noticeForm.body.trim();

    if (title.length < 3 || title.length > 120) {
      setNoticeError('O título deve ter de 3 a 120 caracteres.');
      return;
    }

    if (body.length < 3 || body.length > 2000) {
      setNoticeError('O texto deve ter de 3 a 2000 caracteres.');
      return;
    }

    setNoticeSubmitting(true);
    setNoticeError('');
    setNoticeMessage('');

    try {
      if (editingId) {
        const { error } = await supabase
          .from('notices')
          .update({ title, body })
          .eq('id', editingId);

        if (error) {
          throw error;
        }

        setNoticeMessage('Aviso atualizado.');
      } else {
        const { error } = await supabase.from('notices').insert({
          title,
          body,
          created_by: currentUser.id,
        });

        if (error) {
          throw error;
        }

        setNoticeMessage('Aviso publicado.');
      }

      cancelNoticeForm();
      await loadNotices();
    } catch {
      setNoticeError('Não foi possível salvar o aviso.');
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleNoticeDelete = async (notice) => {
    if (!window.confirm(`Excluir o aviso "${notice.title}"?`)) {
      return;
    }

    setNoticeError('');
    setNoticeMessage('');

    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', notice.id);

    if (error) {
      setNoticeError('Não foi possível excluir o aviso.');
      return;
    }

    setNoticeMessage('Aviso excluído.');
    await loadNotices();
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <Link to="/perfil" className="auth-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao perfil
        </Link>

        <header className="dashboard-header">
          <div className="dashboard-identity">
            <div className="profile-avatar small" aria-hidden="true">
              {getInitials(currentUser.nome)}
            </div>
            <div>
              <span className="dashboard-eyebrow">Membro DACOMP</span>
              <h1 className="dashboard-title">
                Olá, {currentUser.nome.split(' ')[0]}
              </h1>
              <p className="dashboard-subtitle">
                Este é o espaço interno reservado aos membros do DACOMP.
              </p>
            </div>
          </div>

          <div className="dashboard-header-meta">
            <span className={`role-badge ${currentUser.role}`}>
              {roleLabel(currentUser.role)}
            </span>
            <span className="status-pill active">Acesso liberado</span>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">
              <User size={18} aria-hidden="true" />
            </span>
            <span className="stat-label">Matrícula</span>
            <span className="stat-value small">{currentUser.matricula}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <span className="stat-label">Usuário</span>
            <span className="stat-value small">@{currentUser.username}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <CalendarDays size={18} aria-hidden="true" />
            </span>
            <span className="stat-label">Último acesso</span>
            <span className="stat-value small">
              {formatDateTime(currentUser.lastLoginAt)}
            </span>
          </div>
        </section>

        <div className="panel-grid">
          <section className="panel-card notices-card">
            <div className="panel-card-header">
              <div className="panel-card-header-with-icon">
                <span className="panel-card-icon">
                  <Megaphone size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2>Avisos da gestão</h2>
                  <p className="section-description">
                    Membros e administradores podem publicar e editar avisos
                    internos.
                  </p>
                </div>
              </div>

              {!showNoticeForm ? (
                <button
                  type="button"
                  className="icon-text-btn"
                  onClick={startCreateNotice}
                >
                  <Plus size={16} aria-hidden="true" />
                  Novo aviso
                </button>
              ) : null}
            </div>

            {noticeError ? (
              <FormAlert tone="error">{noticeError}</FormAlert>
            ) : null}
            {noticeMessage ? (
              <FormAlert tone="success">{noticeMessage}</FormAlert>
            ) : null}

            {showNoticeForm ? (
              <form className="notice-form" onSubmit={handleNoticeSubmit}>
                <div className="login-field">
                  <label htmlFor="notice-title">Título</label>
                  <div className="login-input-wrapper">
                    <input
                      id="notice-title"
                      type="text"
                      value={noticeForm.title}
                      onChange={(event) =>
                        setNoticeForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Título do aviso"
                      maxLength={120}
                      required
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="notice-body">Texto</label>
                  <textarea
                    id="notice-body"
                    className="notice-textarea"
                    value={noticeForm.body}
                    onChange={(event) =>
                      setNoticeForm((current) => ({
                        ...current,
                        body: event.target.value,
                      }))
                    }
                    placeholder="Escreva o aviso para os membros..."
                    maxLength={2000}
                    rows={4}
                    required
                  />
                </div>

                <div className="notice-form-actions">
                  <button
                    type="submit"
                    className="btn-secondary"
                    disabled={noticeSubmitting}
                  >
                    {noticeSubmitting
                      ? 'Salvando...'
                      : editingId
                        ? 'Salvar alterações'
                        : 'Publicar aviso'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={cancelNoticeForm}
                    disabled={noticeSubmitting}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}

            {noticesLoading ? (
              <div className="empty-state">
                <p>Carregando avisos...</p>
              </div>
            ) : notices.length === 0 ? (
              <div className="empty-state">
                <Megaphone size={24} aria-hidden="true" />
                <p>Nenhum aviso publicado ainda.</p>
                <span>
                  Publique o primeiro aviso para os membros da gestão.
                </span>
                {!showNoticeForm ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={startCreateNotice}
                  >
                    <Plus size={16} aria-hidden="true" />
                    Publicar primeiro aviso
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="notice-list">
                {notices.map((notice) => (
                  <article className="notice-item" key={notice.id}>
                    <div className="notice-item-header">
                      <h3 className="notice-title">{notice.title}</h3>
                      <span className="notice-meta">
                        {formatDateTime(notice.created_at)}
                        {notice.created_by === currentUser.id
                          ? ' · por você'
                          : ' · pela gestão'}
                      </span>
                    </div>
                    <p className="notice-body">{notice.body}</p>
                    <div className="notice-actions">
                      <button
                        type="button"
                        className="icon-text-btn"
                        onClick={() => startEditNotice(notice)}
                      >
                        <Pencil size={14} aria-hidden="true" />
                        Editar
                      </button>
                      <button
                        type="button"
                        className="icon-text-btn danger"
                        onClick={() => handleNoticeDelete(notice)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <span className="panel-card-icon">
                <FileText size={18} aria-hidden="true" />
              </span>
              <h2>Documentos e materiais</h2>
            </div>
            <div className="empty-state">
              <FileText size={24} aria-hidden="true" />
              <p>Nenhum documento disponível.</p>
              <span>
                Atas, regulamentos e materiais internos serão disponibilizados
                nesta área.
              </span>
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <span className="panel-card-icon">
                <CalendarDays size={18} aria-hidden="true" />
              </span>
              <h2>Agenda interna</h2>
            </div>
            <div className="empty-state">
              <CalendarDays size={24} aria-hidden="true" />
              <p>Nenhum evento interno agendado.</p>
              <span>
                Reuniões, assembleias e atividades da diretoria serão listadas
                aqui.
              </span>
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <span className="panel-card-icon">
                <LayoutDashboard size={18} aria-hidden="true" />
              </span>
              <h2>Atalhos do site</h2>
            </div>
            <div className="quick-links">
              <a href="/#gestao">Gestão do DACOMP</a>
              <a href="/#about">Sobre o DACOMP</a>
              <a href="/#mapa">Como chegar</a>
            </div>
          </section>
        </div>

        <p className="panel-footnote">
          Não compartilhe suas credenciais. A senha é pessoal e o acesso é
          protegido pelo Supabase Auth.
        </p>
      </div>
    </div>
  );
}
