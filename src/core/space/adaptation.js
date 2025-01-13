import { Room, Being, State, Link, Kind } from './types';

export function adapt(room: Room, time: number) {
  // Natural restoration
  let quiet = restore(room.quiet, time);
  let clear = sustain(room.clear, time);
  
  // Adapt state
  const state = sense(quiet, clear);
  
  // Strengthen beneficial connections
  const near = room.near.map(link => 
    strengthen(link, state)
  );

  return {
    ...room,
    quiet,
    clear,
    state,
    near
  };
}

function restore(quiet: number, time: number): number {
  // Quiet naturally returns
  const rate = 0.05 * time;
  return Math.min(1, quiet + rate);
}

function sustain(clear: number, time: number): number {
  // Clarity gently fades
  const rate = 0.02 * time;
  return Math.max(0.1, clear - rate);
}

function sense(quiet: number, clear: number): State {
  if (clear > 0.7) return 'bright';
  if (quiet < 0.3) return 'moving';
  if (quiet < 0.7) return 'ready';
  return 'quiet';
}

function strengthen(link: Link, state: State): Link {
  // Links strengthen based on state harmony
  let bond = link.bond;

  if (shouldStrengthen(state, link.kind)) {
    bond = Math.min(1, bond + 0.1);
  } else {
    bond = Math.max(0.1, bond - 0.05);
  }

  return { ...link, bond };
}

function shouldStrengthen(state: State, kind: Kind): boolean {
  // Natural affinities between states and connection types
  const affinities: Record<State, Kind[]> = {
    bright: ['light', 'way'],
    moving: ['life', 'way'],
    ready: ['love', 'life'],
    quiet: ['light', 'love']
  };

  return affinities[state].includes(kind);
}

export function harmonize(rooms: Room[]) {
  // Let rooms influence each other through connections
  rooms.forEach(room => {
    const neighbors = findNeighbors(room, rooms);
    const influences = neighbors.map(n => ({
      quiet: n.room.quiet * n.link.bond,
      clear: n.room.clear * n.link.bond
    }));

    if (influences.length > 0) {
      room.quiet = blend(room.quiet, average(influences.map(i => i.quiet)));
      room.clear = blend(room.clear, average(influences.map(i => i.clear)));
      room.state = sense(room.quiet, room.clear);
    }
  });
}

function findNeighbors(room: Room, rooms: Room[]) {
  return room.near
    .map(link => ({
      room: rooms.find(r => r.id === link.to)!,
      link
    }))
    .filter(n => n.room);
}

function blend(a: number, b: number): number {
  return a + (b - a) * 0.1;
}

function average(numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
} 