import React from 'react';
import { PatternVisualization } from './components';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Natural Communication Patterns</h1>
      </header>
      <main>
        <PatternVisualization />
      </main>
    </div>
  );
}

export default App;