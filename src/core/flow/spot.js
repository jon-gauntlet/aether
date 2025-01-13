import { Feel, Link, Spot, Move, Work, Way, Change, Story, Group, Level } from './core';

// Make a new spot
export function spot(id: string): Spot {
  return {
    id,
    feel: {
      ease: 1,
      depth: 0,
      warmth: 1,
      space: 1
    },
    links: [],
    here: []
  };
}

// Start a new way
export function way(id: string, move: Move = 'flow', work: Work = 'make'): Way {
  return {
    id,
    move,
    work,
    feel: {
      ease: 1,
      depth: 0,
      warmth: 1,
      space: 1
    }
  };
}

// Note a change
export function change(what: string, feel: Feel): Change {
  return {
    when: Date.now(),
    what,
    how: feel
  };
}

// Start a story
export function story(id: string): Story {
  return {
    id,
    changes: [],
    feel: {
      ease: 1,
      depth: 0,
      warmth: 1,
      space: 1
    }
  };
}

// Form a group
export function group(id: string, spot: Spot): Group {
  return {
    id,
    people: [],
    spot,
    way: way(id),
    story: story(id)
  };
}

// Update how things feel
export function update(feel: Feel, by: Partial<Feel>): Feel {
  return {
    ease: by.ease !== undefined ? by.ease : feel.ease,
    depth: by.depth !== undefined ? by.depth : feel.depth,
    warmth: by.warmth !== undefined ? by.warmth : feel.warmth,
    space: by.space !== undefined ? by.space : feel.space
  };
}

// Mix feelings together
export function mix(a: Feel, b: Feel): Feel {
  return {
    ease: (a.ease + b.ease) / 2,
    depth: Math.max(a.depth, b.depth),
    warmth: (a.warmth + b.warmth) / 2,
    space: Math.min(a.space, b.space)
  };
}

// Connect things
export function link(from: string, to: string, kind: string): Link {
  return {
    from,
    to,
    kind,
    strength: 0.1
  };
}

// See if things work together
export function fits(move: Move, work: Work): boolean {
  const good = {
    flow: ['make', 'learn'],
    rest: ['play', 'learn'],
    join: ['share', 'play'],
    help: ['share', 'make']
  };

  return good[move].includes(work);
}

// Check if there's room
export function hasSpace(spot: Spot): boolean {
  return spot.feel.space > 0.3 && spot.here.length < 5;
}

// See how things are going
export function check(group: Group): boolean {
  return (
    group.spot.feel.ease > 0.3 &&
    group.way.feel.warmth > 0.3 &&
    fits(group.way.move, group.way.work)
  );
} 