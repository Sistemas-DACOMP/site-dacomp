export default function Hero() {
  return (
    <section className="hero" id="home">
      {/* Background image with glitch overlay */}
      <div className="hero-bg">
        <img
          src="/images/fotos/elementos site DACOMP.jpg"
          alt="Estudantes DACOMP"
        />
      </div>

      {/* Decorative watermark */}
      <div className="hero-watermark">
        <img
          src="/images/logo/Logo DACOMP 2025 - Perfil.png"
          alt=""
          aria-hidden="true"
        />
      </div>

      <div className="hero-content">
        <div className="hero-text">
          <p className="hero-subtitle">
            Diretório Acadêmico da Computação – Alan Turing
          </p>

          <div className="hero-logo-text">
            <img
              src="/images/logo/Logo DACOMP 2025 - Cor negativa.png"
              alt="DaComp"
            />
          </div>

          <p className="hero-description">
            Representando estudantes, conectando pessoas e transformando a vida acadêmica.
          </p>

          <a href="#about" className="hero-cta">
            EXPLORAR
          </a>
        </div>

        <div className="hero-mascot">
          <img
            src="/images/lobinho/lobo-apontando.png"
            alt="Lobinho - Mascote do DACOMP"
          />
        </div>
      </div>
    </section>
  );
}
