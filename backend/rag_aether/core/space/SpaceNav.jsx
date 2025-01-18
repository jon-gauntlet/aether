import React, { useState, useCallback } from 'react';
import { Space, SpaceType } from '../types';
import { SpaceTransition } from '../types/space';
import './SpaceNav.css';

interface SpaceNavProps {
  currentSpace: Space;
  onSpaceChange: (to: SpaceType, preserveState?: boolean) => void;
  onTransitionComplete?: (transition: SpaceTransition) => void;
}

export const SpaceNav: React.FC<SpaceNavProps> = ({
  currentSpace,
  onSpaceChange,
  onTransitionComplete
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const spaces: Array<{type: SpaceType; icon: string; label: string}> = [
    { type: 'sanctuary', icon: '🏛️', label: 'Sanctuary' },
    { type: 'library', icon: '📚', label: 'Library' },
    { type: 'garden', icon: '🌱', label: 'Garden' },
    { type: 'workshop', icon: '🔧', label: 'Workshop' },
    { type: 'commons', icon: '🤝', label: 'Commons' }
  ];

  const handleSpaceTransition = useCallback((to: SpaceType) => {
    if (isTransitioning || to === currentSpace.config.type) return;

    setIsTransitioning(true);

    // Create transition record
    const transition: SpaceTransition = {
      from: currentSpace.config.type,
      to,
      timestamp: Date.now(),
      preserveState: false // Default to false, can be made configurable
    };

    // Initiate transition
    onSpaceChange(to, transition.preserveState);

    // Notify completion after a brief animation delay
    setTimeout(() => {
      setIsTransitioning(false);
      onTransitionComplete?.(transition);
    }, 300);
  }, [currentSpace, isTransitioning, onSpaceChange, onTransitionComplete]);

  return (
    <nav className="space-nav" aria-label="Space Navigation">
      <div className="nav-container">
        {spaces.map(({ type, icon, label }) => (
          <button
            key={type}
            className={`nav-item ${type === currentSpace.config.type ? 'active' : ''} ${isTransitioning ? 'transitioning' : ''}`}
            onClick={() => handleSpaceTransition(type)}
            disabled={isTransitioning}
            title={label}
            aria-label={`Navigate to ${label}`}
            aria-current={type === currentSpace.config.type ? 'page' : } undefined
          >
            <span className="nav-icon" role="img" aria-hidden="true">
              {icon}
            </span>
            <span className="nav-label">{label}</span>
            {type === currentSpace.config.type && (
              <div className="nav-indicator">
                <div className="indicator-dot" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Current Space Info */}
      <div className="current-space-info">
        <div className="space-title">
          {currentSpace.config.name}
        </div>
        <div className="space-description">
          {currentSpace.config.description}
        </div>
      </div>
    </nav>
  );
}; 