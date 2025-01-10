import { Space, Flow, Presence, FocusDepth, SpaceMood } from './types';

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
    const strength = calculateConnection(spaceA, spaceB);
    const type = determineFlowType(spaceA, spaceB);

    return {
      from: spaceA.id,
      to: spaceB.id,
      strength,
      type
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
    const protection = calculateProtection(presence.focus);
    return protection > interruption.urgency;
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