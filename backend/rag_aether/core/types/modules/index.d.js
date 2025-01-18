declare module '../types/stream' {
  export interface Stream {
    id: string;
    type: string;
    data: any;
  }

  export type PresenceType = 'online' | 'offline' | 'away';
}

declare module '../factories/field' {
  import { Field } from '../types/base';
  export function createDefaultField(): Field;
}

declare module './flow/move' {
  export interface Move {
    type: string;
    direction: string;
    distance: number;
  }
}

declare module './integrate' {
  export interface Integrate {
    see(): any;
    process(data: any): void;
  }
}

declare module './types/core' {
  export type Level = 'low' | 'medium' | 'high';
}

declare module '../types/energy' {
  export interface Energy {
    level: number;
    capacity: number;
    recovery: number;
  }

  export type EnergyState = 'charging' | 'draining' | 'stable';
}

declare module '../autonomic/PredictiveValidation' {
  export interface PredictiveValidation {
    validate(data: any): Promise<ValidationResult[]>;
  }

  export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
  }

  export interface ValidationError {
    message: string;
    code: string;
  }
}

declare module '../energy/EnergySystem' {
  export interface EnergySystem {
    getCurrentEnergy(): number;
    updateEnergy(delta: number): void;
  }
}

declare module '../autonomic/Autonomic' {
  export interface AutonomicSystem {
    process(data: any): void;
    adapt(changes: any): void;
  }
}

declare module '../lib/meilisearch' {
  const client: any;
  export default client;
}

declare module '../types/chat' {
  export interface Message {
    id: string;
    content: string;
    type: MessageType;
    timestamp: number;
  }

  export type MessageType = 'text' | 'system' | 'error';
} 