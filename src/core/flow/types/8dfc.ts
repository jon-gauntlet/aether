/**
 * Natural workspace dynamics
 * Everything flows and adapts like a living space
 */

export interface Space {
  id: string;
  activity: number;     // How active the space is
  focus: number;        // How deep the work is
  mood: SpaceMood;      // The feeling of the space
  connections: Flow[];  // Natural connections to other spaces
}

export interface Flow {
  from: string;
  to: string;
  strength: number;    // How strong the connection is
  type: FlowType;
}

export interface Presence {
  id: string;
  focus: FocusDepth;   // How deep in work someone is
  energy: number;      // How active they are
  availability: number;  // How interruptible they are
}

// Natural, familiar types that feel intuitive
export type SpaceMood = 
  | 'focused'    // Deep work happening
  | 'active'     // Lots of discussion
  | 'casual'     // Social space
  | 'quiet';     // Low activity

export type FocusDepth =
  | 'deep'       // Don't interrupt
  | 'working'    // Minor interruptions ok
  | 'open'       // Available for collaboration
  | 'social';    // Open to casual chat

export type FlowType =
  | 'discussion' // Active conversation
  | 'reference'  // Information sharing
  | 'social'     // Casual chat
  | 'update';    // Status/progress sharing

// The space adapts to protect focus and flow
export interface Protection {
  strength: number;    // How protected the space is
  flexibility: number; // How easily it adapts
  recovery: number;    // How quickly it bounces back
} 