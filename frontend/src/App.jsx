import { Link, Routes, Route } from 'react-router-dom'
import Home from './views/Home'
import About from './views/About'

function App() {
  return (
    <div className="app">
      <header>
        <h1>Welcome to Aether</h1>
        <nav>
          <Link to="/" aria-label="home">Home</Link>
          <Link to="/about" aria-label="about">About</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
