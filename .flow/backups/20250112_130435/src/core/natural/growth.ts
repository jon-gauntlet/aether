import { Being, Room, Depth, State } from './types';

export function grow(being: Being, room: Room, time: number) {
  // Natural development
  const depth = deepen(being.depth, room.state, time);
  const light = illuminate(being.light, room.clear);
  const open = unfold(being.open, depth);

  return {
    ...being,
    depth,
    light,
    open
  };
}

function deepen(current: Depth, state: State, time: number): Depth {
  // Growth influenced by room state
  const rate = stateToRate(state) * time;
  
  if (rate < 0.3) return current;
  
  const path: Depth[] = ['new', 'seeking', 'growing', 'deep'];
  const pos = path.indexOf(current);
  const next = Math.min(pos + Math.floor(rate), 3);
  
  return path[next];
}

function illuminate(current: number, clear: number): number {
  // Inner light responds to room clarity
  const target = clear > 0.7 ? 1 
    : clear > 0.4 ? 0.7
    : 0.4;
  
  return current + (target - current) * 0.1;
}

function unfold(current: number, depth: Depth): number {
  // Openness changes with depth
  const natural = depth === 'deep' ? 0.3
    : depth === 'growing' ? 0.5
    : depth === 'seeking' ? 0.8
    : 1;
    
  return current + (natural - current) * 0.1;
}

function stateToRate(state: State): number {
  // How different states affect growth
  const rates: Record<State, number> = {
    bright: 0.5,
    moving: 0.3,
    ready: 0.4,
    quiet: 0.2
  };
  
  return rates[state];
}

export function gather(beings: Being[], room: Room) {
  // Beings influence each other
  beings.forEach(being => {
    const others = beings.filter(b => b.id !== being.id);
    
    if (others.length > 0) {
      being.light = shareLight(being, others);
      being.open = shareOpen(being, others);
    }
  });
}

function shareLight(one: Being, others: Being[]): number {
  // Light naturally shared
  const average = others.reduce((sum, b) => sum + b.light, 0) / others.length;
  return one.light + (average - one.light) * 0.1;
}

function shareOpen(one: Being, others: Being[]): number {
  // Openness influenced by group
  const average = others.reduce((sum, b) => sum + b.open, 0) / others.length;
  return one.open + (average - one.open) * 0.05;
} 