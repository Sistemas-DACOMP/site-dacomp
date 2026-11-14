import { useEffect, useRef } from 'react';

export default function About() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = sectionRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="about" id="about" ref={sectionRef}>
      {/* Decorative watermarks */}
      <div className="about-watermark">
        <img
          src="/images/logo/Logo DACOMP 2025 - Perfil.png"
          alt=""
          aria-hidden="true"
        />
      </div>

      <div className="about-content">
        <div className="about-left animate-on-scroll from-left">
          <h2 className="about-title">O DACOMP</h2>
          <p className="about-text">
            O DACOMP é uma entidade de representação estudantil que atua em defesa
            dos interesses e direitos dos estudantes dos cursos de Computação da UFU.
            Nosso objetivo é fortalecer a comunidade acadêmica, promover a integração
            entre os estudantes e construir um ambiente universitário mais participativo,
            acolhedor e conectado. Por meio de eventos, projetos, ações acadêmicas e
            espaços de diálogo, buscamos aproximar os estudantes, ampliar oportunidades
            e dar voz às demandas da comunidade, contribuindo para uma formação
            universitária que vai além da sala de aula.
          </p>
        </div>

        <div className="about-right animate-on-scroll from-right">
          {/* Overlapping Card Deck Stack in reference style */}
          <div className="about-cards-deck">
            {/* Front Card */}
            <div className="about-deck-card card-front">
              <img
                src="/images/fotos/festas.jpg"
                alt="Eventos e Festas DACOMP"
                loading="lazy"
                decoding="async"
              />
              <div className="about-card-overlay">
                <h3 className="about-card-title">Integração & Festas</h3>
                <p className="about-card-desc">
                  Festas e integrações para os estudantes se conhecerem e tornar a vida acadêmica mais legal
                </p>
                <a href="#eventos" className="about-card-btn">
                  EXPLORAR
                </a>
              </div>
            </div>

            {/* Card 2 behind */}
            <div className="about-deck-card card-mid">
              <img
                src="/images/fotos/aulao.jpg"
                alt="Aulão DACOMP"
                loading="lazy"
                decoding="async"
              />
              <div className="about-card-overlay">
                <h3 className="about-card-title">Aulões & Acadêmico</h3>
                <p className="about-card-desc">
                  Aulas de apoio e suporte acadêmico para matérias da Computação
                </p>
                <a href="#aulas" className="about-card-btn">
                  EXPLORAR
                </a>
              </div>
            </div>

            {/* Card 3 behind */}
            <div className="about-deck-card card-back">
              <img
                src="/images/fotos/empresas.jpg"
                alt="Parcerias com empresas"
                loading="lazy"
                decoding="async"
              />
              <div className="about-card-overlay">
                <h3 className="about-card-title">Mercado & Empresas</h3>
                <p className="about-card-desc">
                  Organização de eventos que aproximam os estudantes do mercado externo à Universidade
                </p>
                <a href="#materiais" className="about-card-btn">
                  EXPLORAR
                </a>
              </div>
            </div>

            {/* Card 4 behind */}
            <div className="about-deck-card card-far-back">
              <img
                src="/images/fotos/eventos.jpg"
                alt="Eventos da Computação"
                loading="lazy"
                decoding="async"
              />
              <div className="about-card-overlay">
                <h3 className="about-card-title">Comunidade DACOMP</h3>
                <p className="about-card-desc">
                  Representação discente e fortalecimento dos estudantes
                </p>
                <a href="#gestao" className="about-card-btn">
                  EXPLORAR
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
