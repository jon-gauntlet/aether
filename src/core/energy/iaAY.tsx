import React, { useEffect, useState } from 'react';
import { SystemDashboard } from './components/SystemDashboard';
import { LoadingScreen } from './components/LoadingScreen';
import { SystemIntegration } from './core/integration/SystemIntegration';
import { FlowStateGuardian } from './core/flow/FlowStateGuardian';
import { EnergySystem } from './core/energy/EnergySystem';
import { PredictiveValidation } from './core/autonomic/PredictiveValidation';
import { AutonomicSystem } from './core/autonomic/Autonomic';
import './App.css';

function App() {
  const [integration, setIntegration] = useState<SystemIntegration | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeSystems = async () => {
      // Initialize core systems
      const flow = new FlowStateGuardian();
      const energy = new EnergySystem();
      const autonomic = new AutonomicSystem();
      const validation = new PredictiveValidation(autonomic, energy);
      
      // Create system integration
      const systemIntegration = new SystemIntegration(flow, energy, validation);
      
      // Validate initial state
      const isValid = await systemIntegration.validateSystemState();
      if (!isValid) {
        console.warn('Initial system state validation failed');
      }

      setIntegration(systemIntegration);
    };

    // Start initialization
    initializeSystems().catch(console.error);
  }, []);

  const handleInitComplete = () => {
    setIsInitializing(false);
  };

  if (isInitializing || !integration) {
    return <LoadingScreen onComplete={handleInitComplete} />;
  }

  return (
    <div className="app">
      <SystemDashboard integration={integration} />
    </div>
  );
}

export default App;