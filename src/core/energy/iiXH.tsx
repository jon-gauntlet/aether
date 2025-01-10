import React, { useEffect, useState } from 'react';
import { SystemDashboard } from './components/SystemDashboard';
import { SystemIntegration } from './core/integration/SystemIntegration';
import { FlowStateGuardian } from './core/flow/FlowStateGuardian';
import { EnergySystem } from './core/energy/EnergySystem';
import { PredictiveValidation } from './core/autonomic/PredictiveValidation';
import { AutonomicSystem } from './core/autonomic/Autonomic';
import './App.css';

function App() {
  const [integration, setIntegration] = useState<SystemIntegration | null>(null);

  useEffect(() => {
    // Initialize core systems
    const flow = new FlowStateGuardian();
    const energy = new EnergySystem();
    const autonomic = new AutonomicSystem();
    const validation = new PredictiveValidation(autonomic, energy);
    
    // Create system integration
    const systemIntegration = new SystemIntegration(flow, energy, validation);
    setIntegration(systemIntegration);

    // Validate system state periodically
    const validationInterval = setInterval(async () => {
      const isValid = await systemIntegration.validateSystemState();
      if (!isValid) {
        console.warn('System state validation failed');
      }
    }, 5000);

    return () => {
      clearInterval(validationInterval);
    };
  }, []);

  if (!integration) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1>Initializing Systems</h1>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <SystemDashboard integration={integration} />
    </div>
  );
}

export default App;