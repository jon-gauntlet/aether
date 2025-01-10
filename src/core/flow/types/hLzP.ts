/**
 * Natural flow of information and communication
 */

export interface Flow {
  id: string;
  strength: number;     // Current vitality
  direction: Point;     // Natural movement
  draw: number;         // How it attracts attention
  nature: number;       // Quality of the flow
  effect: number;       // Impact on surroundings
}

export interface Message {
  id: string;
  content: any;
  vitality: number;    // Current strength
  movement: Point;     // Natural direction
  activity: number;    // Level of engagement
  presence: number;    // How present it remains
  ties: Connection[];  // Natural connections
}

export interface Field {
  messages: Message[];
  flows: Flow[];
  paths: Map<string, number>;   // Natural pathways
  bounds: Boundary[];           // Natural limits
  centers: Center[];           // Points of gathering
}

export interface Center {
  id: string;
  place: Point;
  strength: number;
  kind: CenterKind;
  harmony: number[];   // What naturally gathers here
}

export interface Boundary {
  id: string;
  strength: number;
  pass: number;       // What moves through
  span: number;       // How long it lasts
  space: Area;
}

export interface Connection {
  from: string;
  to: string;
  strength: number;
  kind: ConnectionKind;
  flow: number;
}

export type CenterKind = 
  | 'deep'       // For focused work
  | 'lively'     // For active discussion
  | 'still'      // For reference
  | 'swift'      // For urgent matters
  | 'free';      // For open exchange

export type ConnectionKind =
  | 'meaning'    // Connected by meaning
  | 'time'       // Connected in time
  | 'theme'      // Connected by theme
  | 'people'     // Connected through people
  | 'flow';      // Connected by movement

export interface Point {
  x: number;
  y: number;
  z: number;
}

export interface Area {
  center: Point;
  reach: number;
  form: 'round' | 'square' | 'column';
} 