import React, { useEffect, useCallback } from 'react';
import { Space, SpaceType, ProtectionState } from '../types';
import { useFlowState } from '../hooks/useFlowState';
import { useProtection } from '../hooks/useProtection';

interface LibraryProps {
  onStateChange?: (state: Partial<Space>) => void;
  onProtectionTrigger?: (violation: any) => void;
}

const defaultProtection: Partial<ProtectionState> = {
  active: true,
  metrics: {
    stability: 0.7,    // Moderate stability for exploration
    resilience: 0.8,   // Strong recovery for learning
    integrity: 0.9,    // High integrity for knowledge
    immunity: 0.6      // Lower immunity to allow learning
  }
};

export const Library: React.FC<LibraryProps> = ({
  onStateChange,
  onProtectionTrigger
}) => {
  const { flowState, startFlow, endFlow } = useFlowState();
  const { protection, checkHealth } = useProtection(defaultProtection);

  // Start in a moderate flow state for learning
  useEffect(() => {
    startFlow();
    return () => {
      endFlow();
    };
  }, []);

  // Monitor learning effectiveness
  useEffect(() => {
    const healthCheck = setInterval(() => {
      const health = checkHealth();
      if (health.integrity < 0.7) {
        onProtectionTrigger?.({
          type: 'space',
          severity: 0.4,
          context: { space: 'library', health }
        });
      }
    }, 45000); // Every 45 seconds

    return () => clearInterval(healthCheck);
  }, [checkHealth, onProtectionTrigger]);

  return (
    <div className="library-space" data-testid="library-space">
      <div className="knowledge-zone">
        {/* Navigation Section */}
        <div className="nav-section">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search knowledge..."
              className="search-input"
            />
          </div>
          <div className="category-tabs">
            <button className="tab active">Recent</button>
            <button className="tab">Favorites</button>
            <button className="tab">Archives</button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="content-grid">
          <div className="knowledge-card">
            <h3>Learning Path</h3>
            <div className="progress-indicator">
              <div 
                className="progress-bar" 
                style={{ width: `${flowState.metrics.clarity * 100}%` }} 
              />
            </div>
          </div>
          
          <div className="knowledge-card">
            <h3>Current Focus</h3>
            <div className="focus-meter">
              <div 
                className="focus-level" 
                style={{ height: `${flowState.metrics.focus * 100}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="learning-status">
            Clarity: {Math.round(flowState.metrics.clarity * 100)}%
          </div>
          <div className="protection-status">
            Knowledge Integrity: {Math.round(protection.metrics.integrity * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}; 