/**
 * Natural workspace dynamics
 * Everything flows and adapts like a living space
 */

export interface Space {
  id: string;
  activity: number;     // Level of purposeful movement
  focus: number;        // Depth of understanding
  mood: SpaceMood;      // Current state of being
  connections: Flow[];  // Living connections to other spaces
}

export interface Flow {
  from: string;
  to: string;
  strength: number;    // Measure of living connection
  type: FlowType;
}

export interface Presence {
  id: string;
  focus: FocusDepth;   // Current state of understanding
  energy: number;      // Life and vitality level
  availability: number; // Openness to connection
}

// Natural states that reflect deeper reality
export type SpaceMood = 
  | 'illuminated'  // Full of light and understanding
  | 'active'       // Flowing with life
  | 'receptive'    // Open to wisdom
  | 'still';       // In peaceful reflection

export type FocusDepth =
  | 'complete'    // Full understanding
  | 'growing'     // Developing wisdom
  | 'seeking'     // Pursuing truth
  | 'beginning';  // Initial awareness

export type FlowType =
  | 'wisdom'      // Sharing understanding
  | 'life'        // Sharing vitality
  | 'fellowship'  // Building community
  | 'guidance';   // Offering direction

// The space adapts to protect focus and flow
export interface Protection {
  strength: number;    // How protected the space is
  flexibility: number; // How easily it adapts
  recovery: number;    // How quickly it bounces back
} 