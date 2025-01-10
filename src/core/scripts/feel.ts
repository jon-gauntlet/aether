/**
 * Simple types that work together naturally
 */

// How things feel
export interface Feel {
  ease: number;      // How smoothly things flow
  depth: number;     // How deep things go
  warmth: number;    // How welcoming it feels
  space: number;     // How much room there is
}

// How things connect
export interface Link {
  from: string;
  to: string;
  kind: string;
  strength: number;
}

// Places to be
export interface Spot {
  id: string;
  feel: Feel;
  links: Link[];
  here: string[];    // Who's around
}

// Ways to move
export type Move = 
  | 'flow'           // Moving naturally
  | 'rest'           // Taking it easy
  | 'join'           // Coming together
  | 'help';          // Giving a hand

// Ways to work
export type Work = 
  | 'make'           // Creating things
  | 'share'          // Working together
  | 'learn'          // Figuring things out
  | 'play';          // Trying things out

// Ways to be
export interface Way {
  id: string;
  move: Move;
  work: Work;
  feel: Feel;
}

// Things that happen
export interface Change {
  when: number;
  what: string;
  how: Feel;
}

// Keeping track
export interface Story {
  id: string;
  changes: Change[];
  feel: Feel;
}

// Working together
export interface Group {
  id: string;
  people: string[];
  spot: Spot;
  way: Way;
  story: Story;
}

// Simple numbers
export type Level = number;    // 0 to 1
export type Count = number;    // Whole numbers
export type Time = number;     // Milliseconds

// Helpful tools
export function blend(a: Level, b: Level): Level {
  return a + (b - a) * 0.1;
}

export function ease(current: Level, target: Level): Level {
  return current + (target - current) * 0.2;
}

export function fade(value: Level): Level {
  return Math.max(0, value - 0.01);
}

export function grow(value: Level): Level {
  return Math.min(1, value + 0.01);
} 