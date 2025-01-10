import { Room, Member, State, Path, Nature } from './types';

export function adapt(room: Room, time: number) {
  // Natural adjustment
  let calm = restore(room.calm, time);
  let focus = maintain(room.focus, time);
  
  // Update atmosphere
  const state = assess(calm, focus);
  
  // Maintain connections
  const paths = room.paths.map(path => 
    adjust(path, state)
  );

  return {
    ...room,
    calm,
    focus,
    state,
    paths
  };
}

function restore(calm: number, time: number): number {
  // Quietness returns naturally
  const rate = 0.05 * time;
  return Math.min(1, calm + rate);
}

function maintain(focus: number, time: number): number {
  // Focus requires active maintenance
  const rate = 0.02 * time;
  return Math.max(0.1, focus - rate);
}

function assess(calm: number, focus: number): State {
  if (focus > 0.7) return 'clear';
  if (calm < 0.3) return 'active';
  if (calm < 0.7) return 'balanced';
  return 'calm';
}

function adjust(path: Path, state: State): Path {
  // Paths develop with use
  let strength = path.strength;

  if (shouldDevelop(state, path.nature)) {
    strength = Math.min(1, strength + 0.1);
  } else {
    strength = Math.max(0.1, strength - 0.05);
  }

  return { ...path, strength };
}

function shouldDevelop(state: State, nature: Nature): boolean {
  // Natural patterns of use
  const patterns: Record<State, Nature[]> = {
    clear: ['work', 'flow'],
    active: ['talk', 'flow'],
    balanced: ['share', 'talk'],
    calm: ['work', 'share']
  };

  return patterns[state].includes(nature);
}

export function balance(rooms: Room[]) {
  // Rooms influence connected rooms
  rooms.forEach(room => {
    const connected = findConnected(room, rooms);
    const effects = connected.map(n => ({
      calm: n.room.calm * n.path.strength,
      focus: n.room.focus * n.path.strength
    }));

    if (effects.length > 0) {
      room.calm = blend(room.calm, average(effects.map(e => e.calm)));
      room.focus = blend(room.focus, average(effects.map(e => e.focus)));
      room.state = assess(room.calm, room.focus);
    }
  });
}

function findConnected(room: Room, rooms: Room[]) {
  return room.paths
    .map(path => ({
      room: rooms.find(r => r.id === path.to)!,
      path
    }))
    .filter(n => n.room);
}

function blend(a: number, b: number): number {
  return a + (b - a) * 0.1;
}

function average(numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
} 