import { useState } from 'react';
import { User } from 'lucide-react';

const membersData = [
  { nome: 'Samuel Amorim', cargo: 'Presidente', diretoria: 'Presidência' },
  { nome: 'Guilherme Pinheiro', cargo: 'Vice-Presidente', diretoria: 'Presidência' },
  { nome: 'Shayene Figueredo', cargo: 'Diretora de Comunicação e Sistemas', diretoria: 'Comunicação e Sistemas' },
  { nome: 'Anne Gabrielle', cargo: 'Vice-Diretora de Comunicação e Sistemas', diretoria: 'Comunicação e Sistemas' },
  { nome: 'Fabio Junior', cargo: 'Coordenador de Comunicação e Sistemas', diretoria: 'Comunicação e Sistemas' },
  { nome: 'Gustavo Luiz', cargo: 'Coordenador de Comunicação e Sistemas', diretoria: 'Comunicação e Sistemas' },
  { nome: 'Kaká', cargo: 'Diretor de Patrimônio', diretoria: 'Patrimônio' },
  { nome: 'Eduardo Susupira', cargo: 'Vice-Diretor de Patrimônio', diretoria: 'Patrimônio' },
  { nome: 'Caçamba', cargo: 'Coordenador de Patrimônio', diretoria: 'Patrimônio' },
  { nome: 'Victor Bertolini', cargo: 'Diretor de Tesouraria', diretoria: 'Tesouraria' },
  { nome: 'Gustavo Meireles', cargo: 'Vice-Diretor de Tesouraria', diretoria: 'Tesouraria' },
  { nome: 'Mariane Paschoini', cargo: 'Coordenadora de Tesouraria', diretoria: 'Tesouraria' },
  { nome: 'Amanda', cargo: 'Coordenadora de Política', diretoria: 'Política' },
  { nome: 'Law Angenny', cargo: 'Coordenadora de Política', diretoria: 'Política' },
  { nome: 'Stefany', cargo: 'Coordenadora de Produtos', diretoria: 'Produtos' },
  { nome: 'Matheux', cargo: 'Secretaria', diretoria: 'Secretaria' },
];

const categories = [
  'Todas',
  'Presidência',
  'Comunicação e Sistemas',
  'Patrimônio',
  'Tesouraria',
  'Política',
  'Produtos',
  'Secretaria',
];

export default function Gestao() {
  const [selectedFilter, setSelectedFilter] = useState('Todas');

  const filteredMembers = selectedFilter === 'Todas'
    ? membersData
    : membersData.filter((member) => member.diretoria === selectedFilter);

  return (
    <section className="gestao-section" id="gestao">
      <div className="gestao-container">
        {/* Header with gestao image */}
        <div className="gestao-header">
          <span className="gestao-badge">GESTÃO 2026 – 2027</span>
          <h2 className="gestao-main-title">Gestão Lovelace</h2>
          <div className="gestao-image-wrapper">
            <img
              src="/images/gestao.png"
              alt="Gestão Lovelace DACOMP 2026-2027"
              className="gestao-image"
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="gestao-filter-wrapper">
          <h3 className="filter-title">Filtrar por diretoria</h3>
          <div className="filter-buttons-grid">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${selectedFilter === cat ? 'active' : ''}`}
                onClick={() => setSelectedFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Members Cards Grid */}
        <div className="members-grid">
          {filteredMembers.map((member, index) => (
            <div key={index} className="member-card">
              <div className="member-avatar">
                <User size={34} />
              </div>
              <h4 className="member-name">{member.nome}</h4>
              <p className="member-role">{member.cargo}</p>
              <span className="member-dept">{member.diretoria}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
