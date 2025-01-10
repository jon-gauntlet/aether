import { Space, Flow, Presence, FocusDepth, SpaceMood, FlowType } from './types';

/**
 * Natural workspace interactions
 * Everything should feel intuitive and familiar
 */

export const space = {
  // Spaces naturally adapt to activity
  adapt(space: Space, presence: Presence[]) {
    const activity = calculateActivity(presence);
    const focus = calculateFocus(presence);
    
    return {
      ...space,
      activity,
      focus,
      mood: determineMood(activity, focus)
    };
  },

  // Join a space naturally
  join(space: Space, presence: Presence) {
    // Space gently adapts to new presence
    const newActivity = space.activity + (presence.energy * 0.2);
    const newFocus = blendFocus(space.focus, presence.focus);

    return {
      ...space,
      activity: newActivity,
      focus: newFocus,
      mood: determineMood(newActivity, newFocus)
    };
  },

  // Spaces naturally connect based on activity
  connect(spaceA: Space, spaceB: Space): Flow {
    return {
      from: spaceA.id,
      to: spaceB.id,
      strength: calculateConnection(spaceA, spaceB),
      type: determineFlowType(spaceA, spaceB)
    };
  }
};

export const focus = {
  // Focus naturally deepens over time
  deepen(presence: Presence, timeSpent: number): Presence {
    const newFocus = presence.focus === 'deep' 
      ? 'deep'
      : deepenFocus(presence.focus, timeSpent);

    return {
      ...presence,
      focus: newFocus,
      availability: calculateAvailability(newFocus)
    };
  },

  // Focus naturally protects itself
  protect(presence: Presence, interruption: any) {
    return calculateProtection(presence.focus) > interruption.urgency;
  }
};

// Natural helper functions with intuitive behavior
function calculateActivity(presence: Presence[]): number {
  return presence.reduce((sum, p) => sum + p.energy, 0) / presence.length;
}

function calculateFocus(presence: Presence[]): number {
  return presence.reduce((sum, p) => sum + (p.focus === 'deep' ? 1 : 0.5), 0);
}

function determineMood(activity: number, focus: number): SpaceMood {
  if (focus > 0.7) return 'focused';
  if (activity > 0.7) return 'active';
  if (activity > 0.3) return 'casual';
  return 'quiet';
}

function deepenFocus(current: FocusDepth, time: number): FocusDepth {
  const depths: FocusDepth[] = ['social', 'open', 'working', 'deep'];
  const currentIndex = depths.indexOf(current);
  const newIndex = Math.min(currentIndex + Math.floor(time / 5), 3);
  return depths[newIndex];
}

function calculateAvailability(focus: FocusDepth): number {
  const levels = { deep: 0.1, working: 0.4, open: 0.7, social: 1 };
  return levels[focus];
}

function blendFocus(spaceFocus: number, presenceFocus: FocusDepth): number {
  const focusValue = presenceFocus === 'deep' ? 1 
    : presenceFocus === 'working' ? 0.7
    : presenceFocus === 'open' ? 0.4
    : 0.2;
  
  return (spaceFocus + focusValue) / 2;
}

// Natural connection strength based on shared activity and focus
function calculateConnection(spaceA: Space, spaceB: Space): number {
  const activityMatch = 1 - Math.abs(spaceA.activity - spaceB.activity);
  const focusMatch = 1 - Math.abs(spaceA.focus - spaceB.focus);
  return (activityMatch + focusMatch) / 2;
}

// Flow type emerges naturally from space characteristics
function determineFlowType(spaceA: Space, spaceB: Space): FlowType {
  if (spaceA.mood === 'focused' || spaceB.mood === 'focused') return 'reference';
  if (spaceA.activity > 0.7 && spaceB.activity > 0.7) return 'discussion';
  if (spaceA.mood === 'casual' && spaceB.mood === 'casual') return 'social';
  return 'update';
}

// Protection level based on focus depth
function calculateProtection(focus: FocusDepth): number {
  const levels = { deep: 0.9, working: 0.6, open: 0.3, social: 0.1 };
  return levels[focus];
} 