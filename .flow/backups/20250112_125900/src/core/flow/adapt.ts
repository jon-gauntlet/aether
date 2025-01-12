import type { Room } from '../types/space/room';
import type { Path } from '../types/utils/path';

export function adapt(room: Room, time: number) {
  // Natural adjustment
  const calm = restoreValue(room.calm, time);
  const focus = maintainValue(room.focus, time);
    
  // Update atmosphere
  return {
    calm,
    focus
  };
}

function restoreValue(value: number, time: number): number {
  // Quietness returns naturally
  const rate = 0.05 * time;
  return Math.min(1, value + rate);
}

function maintainValue(value: number, time: number): number {
  // Focus requires active maintenance
  const rate = 0.02 * time;
  return Math.max(0.1, value - rate);
}

// Helper functions with proper types
function normalize(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function validate(e: number): number {
  return isNaN(e) ? 0 : normalize(e);
}

function check(e: number): boolean {
  return e >= 0 && e <= 1;
}

function processPath(path: Path): number {
  return normalize(path.strength);
}

function calculate(n: number): number {
  return validate(n * 1.1);
} 