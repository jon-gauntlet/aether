import { Room, Link, Being, Depth, State, Kind } from './types';

export const room = {
  tend(room: Room, beings: Being[]) {
    const quiet = findQuiet(beings);
    const clear = findClarity(beings);
    
    return {
      ...room,
      quiet,
      clear,
      state: sense(quiet, clear)
    };
  },

  enter(room: Room, being: Being) {
    const newQuiet = Math.max(0, room.quiet - (being.light * 0.1));
    const newClear = blend(room.clear, being.depth);

    return {
      ...room,
      quiet: newQuiet,
      clear: newClear,
      state: sense(newQuiet, newClear)
    };
  },

  draw(a: Room, b: Room): Link {
    return {
      from: a.id,
      to: b.id,
      bond: feel(a, b),
      kind: know(a, b)
    };
  }
};

export const being = {
  deepen(one: Being, time: number): Being {
    const newDepth = one.depth === 'deep'
      ? 'deep'
      : grow(one.depth, time);

    return {
      ...one,
      depth: newDepth,
      open: see(newDepth)
    };
  },

  shield(one: Being, force: any) {
    return guard(one.depth) > force.strength;
  }
};

function findQuiet(beings: Being[]): number {
  return 1 - (beings.reduce((sum, b) => sum + b.light, 0) / beings.length);
}

function findClarity(beings: Being[]): number {
  return beings.reduce((sum, b) => sum + (b.depth === 'deep' ? 1 : 0.5), 0);
}

function sense(quiet: number, clear: number): State {
  if (clear > 0.7) return 'bright';
  if (quiet < 0.3) return 'moving';
  if (quiet < 0.7) return 'ready';
  return 'quiet';
}

function grow(now: Depth, time: number): Depth {
  const path: Depth[] = ['new', 'seeking', 'growing', 'deep'];
  const i = path.indexOf(now);
  const next = Math.min(i + Math.floor(time / 5), 3);
  return path[next];
}

function see(depth: Depth): number {
  const sight = { deep: 0.1, growing: 0.4, seeking: 0.7, new: 1 };
  return sight[depth];
}

function blend(roomClear: number, beingDepth: Depth): number {
  const value = beingDepth === 'deep' ? 1 
    : beingDepth === 'growing' ? 0.7
    : beingDepth === 'seeking' ? 0.4
    : 0.2;
  
  return (roomClear + value) / 2;
}

function feel(a: Room, b: Room): number {
  const quiet = 1 - Math.abs(a.quiet - b.quiet);
  const clear = 1 - Math.abs(a.clear - b.clear);
  return (quiet + clear) / 2;
}

function know(a: Room, b: Room): Kind {
  if (a.state === 'bright' || b.state === 'bright') return 'light';
  if (a.quiet < 0.3 && b.quiet < 0.3) return 'life';
  if (a.state === 'ready' && b.state === 'ready') return 'love';
  return 'way';
}

function guard(depth: Depth): number {
  const shield = { deep: 0.9, growing: 0.6, seeking: 0.3, new: 0.1 };
  return shield[depth];
} 