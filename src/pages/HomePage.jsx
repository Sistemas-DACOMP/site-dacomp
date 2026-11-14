import Hero from '../components/Hero';
import About from '../components/About';
import MapSection from '../components/MapSection';
import Gestao from '../components/Gestao';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <MapSection />
      <Gestao />
    </main>
  );
}
