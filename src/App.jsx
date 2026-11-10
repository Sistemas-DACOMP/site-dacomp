import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import MapSection from './components/MapSection'
import Gestao from './components/Gestao'

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <MapSection />
        <Gestao />
      </main>
    </>
  )
}

export default App
