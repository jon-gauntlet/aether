import React from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import ChatContainer from './components/ChatContainer'

const Home = () => (
  <div>
    <h1>Welcome to Aether</h1>
    <ChatContainer />
  </div>
)

const About = () => (
  <div>
    <h1>About Aether</h1>
    <p>A modern chat application built with React and Supabase</p>
  </div>
)

const App = () => {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  )
}

export default App 