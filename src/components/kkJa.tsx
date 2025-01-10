import React, { useEffect, useState } from 'react';
import { SystemDashboard } from './components/SystemDashboard';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SystemIntegration } from './core/integration/SystemIntegration';
import { FlowStateGuardian } from './core/flow/FlowStateGuardian';
import { EnergySystem } from './core/energy/EnergySystem';
import { PredictiveValidation } from './core/autonomic/PredictiveValidation';
import { AutonomicSystem } from './core/autonomic/Autonomic';
import './App.css';

function App() {
  const [integration, setIntegration] = useState<SystemIntegration | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeSystems = async () => {
      try {
        // Initialize core systems
        const flow = new FlowStateGuardian();
        const energy = new EnergySystem();
        const autonomic = new AutonomicSystem();
        const validation = new PredictiveValidation(autonomic, energy);
        
        // Create system integration
        const systemIntegration = new SystemIntegration(
          flow,
          energy,
          validation,
          autonomic
        );
        
        // Validate initial state
        const validation_result = await systemIntegration.validateSystemState();
        if (!validation_result.isValid) {
          console.warn('Initial system state validation failed:', validation_result.insights);
        }

        setIntegration(systemIntegration);
      } catch (error) {
        console.error('Failed to initialize systems:', error);
        setError(error instanceof Error ? error : new Error('Failed to initialize systems'));
      } finally {
        setIsInitializing(false);
      }
    };

    // Start initialization
    initializeSystems();
  }, []);

  if (isInitializing) {
    return <LoadingScreen message="Initializing core systems..." />;
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div className="error-container">
          <h2>System Initialization Failed</h2>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Retry Initialization
          </button>
        </div>
      </ErrorBoundary>
    );
  }

  if (!integration) {
    return <LoadingScreen message="Waiting for system integration..." />;
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <SystemDashboard integration={integration} />
      </div>
    </ErrorBoundary>
  );
}

export default App;