/**
 * Natural workspace dynamics
 * Everything flows and adapts like a living space
 */

export interface Room {
  id: string;
  quiet: number;      // Inner stillness
  clear: number;      // Mental clarity
  state: State;       // Current condition
  near: Link[];       // Connections
}

export interface Link {
  from: string;
  to: string;
  bond: number;      // Connection strength
  kind: Kind;        // Nature of connection
}

export interface Being {
  id: string;
  depth: Depth;      // Level of understanding
  light: number;     // Inner vitality
  open: number;      // Receptivity
}

export type State = 
  | 'bright'     // Clear and aware
  | 'moving'     // In motion
  | 'ready'      // Prepared
  | 'quiet';     // At rest

export type Depth =
  | 'deep'       // Full
  | 'growing'    // Developing
  | 'seeking'    // Learning
  | 'new';       // Beginning

export type Kind =
  | 'light'      // Illumination
  | 'life'       // Vitality
  | 'love'       // Connection
  | 'way';       // Direction

export interface Guard {
  strength: number;  // Protection level
  yield: number;    // Adaptability
  heal: number;     // Recovery rate
} 