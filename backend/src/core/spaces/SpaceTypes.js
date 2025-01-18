// Space types representing different channel environments
export const SpaceTypes = {
  SANCTUARY: {
    type: 'SANCTUARY',
    description: 'Deep focus spaces for concentrated work',
    characteristics: {
      energyLevel: 'low',
      focusLevel: 'high',
      socialLevel: 'minimal',
      notificationPreference: 'do-not-disturb'
    }
  },
  WORKSHOP: {
    type: 'WORKSHOP', 
    description: 'Collaborative spaces for creation and building',
    characteristics: {
      energyLevel: 'high',
      focusLevel: 'medium',
      socialLevel: 'medium',
      notificationPreference: 'important-only'
    }
  },
  GARDEN: {
    type: 'GARDEN',
    description: 'Creative spaces for growth and exploration',
    characteristics: {
      energyLevel: 'medium',
      focusLevel: 'medium',
      socialLevel: 'medium',
      notificationPreference: 'all'
    }
  },
  COMMONS: {
    type: 'COMMONS',
    description: 'Social spaces for community interaction',
    characteristics: {
      energyLevel: 'high',
      focusLevel: 'low',
      socialLevel: 'high',
      notificationPreference: 'all'
    }
  },
  LIBRARY: {
    type: 'LIBRARY',
    description: 'Learning spaces for knowledge sharing',
    characteristics: {
      energyLevel: 'low',
      focusLevel: 'high',
      socialLevel: 'low',
      notificationPreference: 'mentions-only'
    }
  },
  RECOVERY: {
    type: 'RECOVERY',
    description: 'Rest spaces for restoration and reflection',
    characteristics: {
      energyLevel: 'minimal',
      focusLevel: 'low',
      socialLevel: 'low',
      notificationPreference: 'none'
    }
  }
};

// Helper functions for space management
export const getSpaceCharacteristics = (spaceType) => {
  return SpaceTypes[spaceType]?.characteristics || null;
};

export const getSpaceDescription = (spaceType) => {
  return SpaceTypes[spaceType]?.description || '';
};

export const isValidSpaceType = (spaceType) => {
  return Object.keys(SpaceTypes).includes(spaceType);
};

export const getDefaultSpaceType = () => {
  return SpaceTypes.COMMONS;
}; 