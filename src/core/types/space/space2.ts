/**
 * Natural workspace dynamics
 * Everything flows and adapts like a living space
 */

export interface Room {
  id: string;
  calm: number;       // Ambient quietness
  focus: number;      // Collective focus
  state: State;       // Current atmosphere
  paths: Path[];      // Connected rooms
}

export interface Path {
  from: string;
  to: string;
  strength: number;   // How well-traveled
  nature: Nature;     // Type of connection
}

export interface Member {
  id: string;
  stage: Stage;      // Current progress
  energy: number;    // Current engagement
  attention: number; // Current receptivity
}

export type State = 
  | 'clear'      // High focus
  | 'active'     // Engaged discussion
  | 'balanced'   // Ready for either
  | 'calm';      // Peaceful

export type Stage =
  | 'focused'    // Deep in work
  | 'engaged'    // Actively working
  | 'learning'   // Getting oriented
  | 'joining';   // Just arrived

export type Nature =
  | 'work'       // Task-focused
  | 'talk'       // Discussion-focused
  | 'share'      // Collaboration
  | 'flow';      // Natural movement

export interface Space {
  stability: number;  // Steadiness
  flexibility: number; // Adaptability
  recovery: number;   // Bounce-back
