import React, { useEffect, useCallback, useState } from 'react';
import { Space, SpaceType } from '../types';
import { ProtectionState } from '../types/protection';
import { useFlowState } from '../hooks/useFlowState';
import { useProtection } from '../hooks/useProtection';

interface GardenProps {
  onStateChange?: (state: Partial<Space>) => void;
  onProtectionTrigger?: (violation: any) => void;
}

const defaultProtection: Partial<ProtectionState> = {
  active: true,
  metrics: {
    stability: 0.5,    // Lower stability to allow exploration
    resilience: 0.9,   // High resilience for experimentation
    integrity: 0.7,    // Moderate integrity for flexibility
    immunity: 0.5      // Lower immunity to embrace change
  }
};

export const Garden: React.FC<GardenProps> = ({
  onStateChange,
  onProtectionTrigger
}) => {
  const { flowState, startFlow, endFlow, updateIntensity } = useFlowState();
  const { protection, checkHealth, reinforce } = useProtection();
  const [activeZone, setActiveZone] = useState<string>('seedling');

  // Start in a low-intensity flow state for exploration
  useEffect(() => {
    startFlow();
    updateIntensity('low');
    return () => {
      endFlow();
    };
  }, []);

  // Adaptive protection based on exploration patterns
  useEffect(() => {
    const adaptCheck = setInterval(() => {
      const health = checkHealth();
      if (health.resilience > 0.8) {
        // If resilient, encourage more exploration
        updateIntensity('medium');
        reinforce(0.1);
      }
      if (health.stability < 0.4) {
        onProtectionTrigger?.({
          type: 'space',
          severity: 0.3,
          timestamp: Date.now(),
          context: { space: 'garden', health }
        });
      }
    }, 60000); // Every minute

    return () => clearInterval(adaptCheck);
  }, [checkHealth, onProtectionTrigger, updateIntensity, reinforce]);

  // Handle zone transitions
  const handleZoneChange = useCallback((zone: string) => {
    setActiveZone(zone);
    onStateChange?.({
      id: 'garden',
      config: {
        type: 'garden',
        name: 'Exploration Garden',
        description: `Currently exploring: ${zone}`,
        protection: defaultProtection
      }
    });
  }, [onStateChange]);

  return (
    <div className="garden-space" data-testid="garden-space">
      <div className="exploration-zone">
        {/* Zone Navigation */}
        <div className="zone-nav">
          <button 
            className={`zone-btn ${activeZone === 'seedling' ? 'active' : ''}`}
            onClick={() => handleZoneChange('seedling')}
          >
            Seedling Ideas
          </button>
          <button 
            className={`zone-btn ${activeZone === 'growing' ? 'active' : ''}`}
            onClick={() => handleZoneChange('growing')}
          >
            Growing Projects
          </button>
          <button 
            className={`zone-btn ${activeZone === 'blooming' ? 'active' : ''}`}
            onClick={() => handleZoneChange('blooming')}
          >
            Blooming Concepts
          </button>
        </div>

        {/* Exploration Area */}
        <div className="garden-grid">
          <div className="garden-card">
            <div className="card-header">
              <h3>Current Zone: {activeZone}</h3>
              <div className="flow-badge">
                Flow: {flowState.intensity}
              </div>
            </div>
            <div className="zone-content">
              {/* Zone-specific content */}
            </div>
          </div>

          <div className="garden-card">
            <div className="card-header">
              <h3>Protection Status</h3>
            </div>
            <div className="protection-grid">
              <div className="protection-item">
                <div className="protection-label">Stability</div>
                <div className="protection-value">
                  {Math.round((defaultProtection.metrics?.stability ?? 0) * 100)}%
                </div>
              </div>
              <div className="protection-item">
                <div className="protection-label">Integrity</div>
                <div className="protection-value">
                  {Math.round((defaultProtection.metrics?.integrity ?? 0) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 