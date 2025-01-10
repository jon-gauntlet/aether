import React from 'react';
import { SystemMonitor } from './components/SystemMonitor';
import { FlowStateIndicator } from './components/FlowStateIndicator';
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
          <div className="monitor-grid">
            <div className="monitor-card">
              <h2>System State</h2>
              <SystemMonitor width={800} height={400} />
            </div>
            <div className="monitor-card">
              <h2>Flow State</h2>
              <FlowStateIndicator size={300} showMetrics={true} />
            </div>
          </div>
        </section>
      </main>
      <footer className="app-footer">
        <p>Flow State Protection Active</p>
      </footer>
    </div>
  );
}

export default App;