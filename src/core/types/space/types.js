/**
 * A place for people to work together naturally
 */

import { FlowState } from '../flow/types';
import { ProtectionState } from '../protection/protection';

// Basic space types
export type SpaceType = 'workshop' | 'sanctuary' | 'library' | 'garden' | 'commons';

export type Feel = 
  | 'flowing'    // Work going well
  | 'chatty'     // People talking
  | 'mixed'      // Bit of everything
  | 'quiet';     // Nice and peaceful

export type Doing =
  | 'working'    // Getting things done
  | 'helping'    // Working with others
  | 'looking'    // Finding their way
  | 'around';    // Just hanging out

export type Way =
  | 'work'       // Getting things done
  | 'chat'       // Having a talk
  | 'help'       // Giving a hand
  | 'wander';    // Just moving about

// Space interfaces
export interface Place {
  id: string;
  quiet: number;      // How peaceful it is
  flow: number;       // How work is going
  feel: Feel;         // Current mood
  doors: Door[];      // Ways to other places
}

export interface Door {
  from: string;
  to: string;
  use: number;        // How often used
  way: Way;          // What it's used for
}

export interface Person {
  id: string;
  doing: Doing;      // What they're up to
  mood: number;      // How they're feeling
  here: number;      // How present they are
}

export interface Setting {
  steady: number;    // Keeps its feel
  easy: number;      // Changes smoothly
  fresh: number;     // Stays welcoming
}

// Transition and state interfaces
export interface TransitionMetrics {
  coherence: number;   // How well state is preserved
  stability: number;   // How stable the transition is
  efficiency: number;  // How fast and smooth the transition is
  preservation: number; // How well flow state is maintained
}

export interface SpaceState {
  type: SpaceType;
  active: boolean;
  flowState: FlowState;
  protection: ProtectionState;
  lastTransition: number;
}

export interface SpaceTransition {
  from: SpaceType;
  to: SpaceType;
  duration: number;
  metrics: TransitionMetrics;
  timestamp: number;
}

export interface SpaceContext {
  type: SpaceType;
  state: SpaceState;
  transitions: SpaceTransition[];
  metrics: TransitionMetrics;
}

// Re-export for convenience
export type { FlowState, ProtectionState };
