import React from 'react';
import { SystemMonitor } from './components/SystemMonitor';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Aether</h1>
        <p>Natural Communication System</p>
      </header>
      <main className="app-main">
        <section className="system-section">
          <h2>System State</h2>
          <SystemMonitor width={800} height={400} />
        </section>
      </main>
      <footer className="app-footer">
        <p>Flow State Protection Active</p>
      </footer>
    </div>
  );
}

export default App;