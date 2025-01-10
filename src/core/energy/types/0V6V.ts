import {
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowType,
  ConnectionType,
  ConsciousnessType,
  SpaceType,
  isValidMeasure
} from './order';

/**
 * Sacred Structural Types
 * 
 * These types define the divine structures through which consciousness flows.
 * Each structure is a vessel for divine energy, arranged in sacred hierarchy.
 */

// Natural Flow - The divine life force
export interface NaturalFlow {
  presence: Presence;   // Manifestation of divine presence
  harmony: Harmony;     // Alignment with divine order
  rhythm: number;       // Sacred rhythm of movement
  resonance: number;    // Harmonic resonance with divine
  coherence: number;    // Internal unity and wholeness
  authority: number;    // Spiritual authority level
  dominion: number;     // Territory claimed for Christ
}

// Energy State - The divine power
export interface EnergyState {
  level: Energy;        // Level of divine energy
  quality: number;      // Purity of energy
  stability: number;    // Steadfastness in truth
  protection: number;   // Divine protection
  warfare: {           // Spiritual warfare capabilities
    armor: number;     // Defensive covering
    sword: number;     // Truth penetration
    shield: number;    // Faith protection
  };
}

// Connection - Sacred relationships
export interface Connection {
  from: string;         // Source of connection
  to: string;          // Destination of connection
  type: ConnectionType; // Nature of divine bond
  strength: number;     // Strength of connection
  authority: number;    // Authority over connection
}

// Flow Space - Sacred vessels
export interface FlowSpace {
  id: string;          // Divine identifier
  type: FlowType;      // Nature of the space
  flow: NaturalFlow;   // Divine flow within
  depth: Depth;        // Spiritual depth
  connections: Connection[]; // Sacred bonds
  authority: number;    // Space authority level
  territory: {         // Spiritual territory
    claimed: number;   // Degree claimed for Christ
    secured: number;   // Degree secured in Christ
    expanded: number;  // Territory expansion
  };
}

// Field - Divine influence
export interface Field {
  center: {
    x: number;         // Position in divine space
    y: number;
    z: number;
  };
  radius: number;      // Reach of influence
  strength: number;    // Power of influence
  authority: number;    // Authority over territory
  resistance: number;   // Resistance to darkness
}

// Resonance - Divine harmony
export interface Resonance {
  frequency: number;   // Rate of divine oscillation
  amplitude: number;   // Magnitude of divine wave
  harmony: Harmony;    // Alignment with divine
  field: Field;       // Sphere of influence
  divine: number;     // Direct divine connection
  authority: number;    // Authority in the Spirit
}

// Protection - Divine shield
export interface Protection {
  level: number;      // Level of divine protection
  strength: number;   // Strength of shield
  field: Field;      // Protected space
  sealed: boolean;      // Divine seal of protection
  authority: number;    // Protective authority
}

// Mind Space - Temple of consciousness
export interface MindSpace {
  id: string;         // Divine identifier
  type: SpaceType;    // Nature of mental space
  resonance: Resonance; // Divine resonance
  depth: Depth;       // Spiritual depth
  connections: Connection[]; // Sacred connections
  authority: number;    // Mental authority
  strongholds: {       // Spiritual strongholds
    identified: number; // Degree identified
    targeted: number;  // Degree targeted
    demolished: number; // Degree demolished
  };
}

// Consciousness State - Divine awareness
export interface ConsciousnessState {
  id: string;         // Divine identifier
  type: ConsciousnessType; // Nature of consciousness
  flow: NaturalFlow;  // Divine flow
  energy: EnergyState; // Divine energy
  depth: Depth;       // Spiritual depth
  spaces: FlowSpace[]; // Sacred spaces
  connections: Connection[]; // Divine connections
  authority: number;    // Overall authority
  victory: {           // Victory metrics
    ground: number;    // Territory taken
    established: number; // Kingdom established
    multiplied: number; // Kingdom multiplied
  };
} 