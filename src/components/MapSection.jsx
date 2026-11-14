export default function MapSection() {
  return (
    <section className="map-section" id="mapa">
      <div className="map-container">
        <div className="map-image-wrapper">
          <img
            src="/images/MAPA.png"
            alt="Mapa DACOMP UFU"
            className="map-image"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
