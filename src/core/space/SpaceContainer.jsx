import React, { useState, useCallback } from 'react';
import { Space, SpaceType } from '../types';
import { SpaceTransition } from '../types/space';
import { SpaceNav } from './SpaceNav';
import { Sanctuary } from './Sanctuary';
import { Library } from './Library';
import { Garden } from './Garden';
import { Workshop } from './Workshop';
import { Commons } from './Commons';
import './SpaceContainer.css';

interface SpaceContainerProps {
  initialSpace?: SpaceType;
  onSpaceChange?: (space: Space) => void;
  onTransition?: (transition: SpaceTransition) => void;
}

export const SpaceContainer: React.FC<SpaceContainerProps> = ({
  initialSpace = 'sanctuary',
  onSpaceChange,
  onTransition
}) => {
  // Current space state
  const [currentSpace, setCurrentSpace] = useState<Space>({
    id: initialSpace,
    config: {
      type: initialSpace,
      name: getSpaceName(initialSpace),
      description: getSpaceDescription(initialSpace),
      protection: {}
    },
    state: {
      health: 1,
      energy: 1,
      focus: 1,
      context: {}
    },
    isActive: true,
    lastAccessed: Date.now()
  });

  // Space transition history
  const [transitions, setTransitions] = useState<SpaceTransition[]>([]);

  // Handle space changes
  const handleSpaceChange = useCallback((to: SpaceType, preserveState = false) => {
    const transition: SpaceTransition = {
      from: currentSpace.config.type,
      to,
      timestamp: Date.now(),
      preserveState
    };

    // Update transition history
    setTransitions(prev => [...prev, transition]);
    onTransition?.(transition);

    // Create new space state
    const newSpace: Space = {
      id: to,
      config: {
        type: to,
        name: getSpaceName(to),
        description: getSpaceDescription(to),
        protection: {}
      },
      state: preserveState ? currentSpace.state : {
        health: 1,
        energy: 1,
        focus: 1,
        context: {}
      },
      isActive: true,
      lastAccessed: Date.now()
    };

    setCurrentSpace(newSpace);
    onSpaceChange?.(newSpace);
  }, [currentSpace, onSpaceChange, onTransition]);

  // Handle state updates from spaces
  const handleStateChange = useCallback((state: Partial<Space>) => {
    setCurrentSpace(prev => ({
      ...prev,
      ...state,
      lastAccessed: Date.now()
    }));
  }, []);

  // Handle protection violations
  const handleProtectionTrigger = useCallback((violation: any) => {
    // Log violation and update space state
    console.warn('Protection violation:', violation);
    handleStateChange({
      state: {
        ...currentSpace.state,
        health: Math.max(0, currentSpace.state.health - 0.1)
      }
    });
  }, [currentSpace.state, handleStateChange]);

  // Render current space
  const renderSpace = () => {
    const commonProps = {
      onStateChange: handleStateChange,
      onProtectionTrigger: handleProtectionTrigger
    };

    switch (currentSpace.config.type) {
      case 'sanctuary':
        return <Sanctuary {...commonProps} />;
      case 'library':
        return <Library {...commonProps} />;
      case 'garden':
        return <Garden {...commonProps} />;
      case 'workshop':
        return <Workshop />;
      case 'commons':
        return <Commons {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-container">
      <SpaceNav
        currentSpace={currentSpace}
        onSpaceChange={handleSpaceChange}
        onTransitionComplete={onTransition}
      />
      <div className="space-content">
        {renderSpace()}
      </div>
    </div>
  );
};

// Helper functions
function getSpaceName(type: SpaceType): string {
  switch (type) {
    case 'sanctuary':
      return 'Deep Focus Sanctuary';
    case 'library':
      return 'Knowledge Library';
    case 'garden':
      return 'Exploration Garden';
    case 'workshop':
      return 'Creation Workshop';
    case 'commons':
      return 'Community Commons';
  }
}

function getSpaceDescription(type: SpaceType): string {
  switch (type) {
    case 'sanctuary':
      return 'A protected space for deep focus and flow';
    case 'library':
      return 'Organize and access your knowledge base';
    case 'garden':
      return 'Explore and grow new ideas';
    case 'workshop':
      return 'Build and create with powerful tools';
    case 'commons':
      return 'Share and collaborate with the community';
  }
} 