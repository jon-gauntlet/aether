import { Space, Flow, Presence, FocusDepth, SpaceMood, FlowType } from './types';

/**
 * Natural workspace interactions
 * Everything flows according to perfect order
 */

export const space = {
  // Spaces naturally align with truth
  adapt(space: Space, presence: Presence[]) {
    const activity = calculateActivity(presence);
    const focus = calculateFocus(presence);
    
    return {
      ...space,
      activity,
      focus,
      mood: determineState(activity, focus)
    };
  },

  // Join in harmony with the space
  join(space: Space, presence: Presence) {
    const newActivity = space.activity + (presence.energy * 0.2);
    const newFocus = harmonize(space.focus, presence.focus);

    return {
      ...space,
      activity: newActivity,
      focus: newFocus,
      mood: determineState(newActivity, newFocus)
    };
  },

  // Spaces connect according to perfect order
  connect(spaceA: Space, spaceB: Space): Flow {
    return {
      from: spaceA.id,
      to: spaceB.id,
      strength: measureHarmony(spaceA, spaceB),
      type: determineFlowNature(spaceA, spaceB)
    };
  }
};

export const focus = {
  // Understanding deepens naturally
  deepen(presence: Presence, timeSpent: number): Presence {
    const newFocus = presence.focus === 'complete' 
      ? 'complete'
      : growInUnderstanding(presence.focus, timeSpent);

    return {
      ...presence,
      focus: newFocus,
      availability: measureAvailability(newFocus)
    };
  },

  // Natural protection of deep understanding
  protect(presence: Presence, interruption: any) {
    return measureProtection(presence.focus) > interruption.urgency;
  }
};

// Natural helper functions that reflect perfect order
function calculateActivity(presence: Presence[]): number {
  return presence.reduce((sum, p) => sum + p.energy, 0) / presence.length;
}

function calculateFocus(presence: Presence[]): number {
  return presence.reduce((sum, p) => sum + (p.focus === 'complete' ? 1 : 0.5), 0);
}

function determineState(activity: number, focus: number): SpaceMood {
  if (focus > 0.7) return 'illuminated';
  if (activity > 0.7) return 'active';
  if (activity > 0.3) return 'receptive';
  return 'still';
}

function growInUnderstanding(current: FocusDepth, time: number): FocusDepth {
  const depths: FocusDepth[] = ['beginning', 'seeking', 'growing', 'complete'];
  const currentIndex = depths.indexOf(current);
  const newIndex = Math.min(currentIndex + Math.floor(time / 5), 3);
  return depths[newIndex];
}

function measureAvailability(focus: FocusDepth): number {
  const levels = { complete: 0.1, growing: 0.4, seeking: 0.7, beginning: 1 };
  return levels[focus];
}

function harmonize(spaceFocus: number, presenceFocus: FocusDepth): number {
  const focusValue = presenceFocus === 'complete' ? 1 
    : presenceFocus === 'growing' ? 0.7
    : presenceFocus === 'seeking' ? 0.4
    : 0.2;
  
  return (spaceFocus + focusValue) / 2;
}

function measureHarmony(spaceA: Space, spaceB: Space): number {
  const activityAlignment = 1 - Math.abs(spaceA.activity - spaceB.activity);
  const focusAlignment = 1 - Math.abs(spaceA.focus - spaceB.focus);
  return (activityAlignment + focusAlignment) / 2;
}

function determineFlowNature(spaceA: Space, spaceB: Space): FlowType {
  if (spaceA.mood === 'illuminated' || spaceB.mood === 'illuminated') return 'wisdom';
  if (spaceA.activity > 0.7 && spaceB.activity > 0.7) return 'life';
  if (spaceA.mood === 'receptive' && spaceB.mood === 'receptive') return 'fellowship';
  return 'guidance';
}

function measureProtection(focus: FocusDepth): number {
  const levels = { complete: 0.9, growing: 0.6, seeking: 0.3, beginning: 0.1 };
  return levels[focus];
} 