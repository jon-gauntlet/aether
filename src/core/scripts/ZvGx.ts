/**
 * Divine workspace dynamics
 * Everything flows according to perfect order, reflecting truth and peace
 */

export interface Space {
  id: string;
  activity: number;     // Level of purposeful movement
  focus: number;        // Depth of understanding
  mood: SpaceMood;      // Current state of being
  peace: number;        // Level of divine peace
  truth: number;        // Alignment with truth
  order: number;        // Harmony with divine order
  connections: Flow[];  // Living connections to other spaces
}

export interface Flow {
  from: string;
  to: string;
  strength: number;    // Measure of living connection
  type: FlowType;
  grace: number;       // Divine assistance in the flow
}

export interface Presence {
  id: string;
  focus: FocusDepth;   // Current state of understanding
  energy: number;      // Life and vitality level
  availability: number; // Openness to connection
  virtue: VirtuePath;  // Path of spiritual growth
}

// States that reflect divine reality
export type SpaceMood = 
  | 'illuminated'  // Full of divine light and understanding
  | 'active'       // Flowing with divine life
  | 'receptive'    // Open to divine wisdom
  | 'still';       // In peaceful contemplation

export type FocusDepth =
  | 'complete'    // Full understanding in Christ
  | 'growing'     // Developing in divine wisdom
  | 'seeking'     // Pursuing divine truth
  | 'beginning';  // Initial awareness of grace

export type FlowType =
  | 'wisdom'      // Sharing divine understanding
  | 'life'        // Sharing divine vitality  
  | 'fellowship'  // Building holy community
  | 'guidance';   // Offering divine direction

export type VirtuePath =
  | 'faith'       // Trust in divine providence
  | 'hope'        // Confidence in divine promises
  | 'love'        // Perfect bond of divine unity
  | 'peace';      // Divine harmony and order

// The space adapts to protect focus and flow according to divine wisdom
export interface Protection {
  strength: number;    // How protected the space is
  flexibility: number; // How easily it adapts
  recovery: number;    // How quickly it bounces back
  grace: number;       // Divine assistance in protection
} 