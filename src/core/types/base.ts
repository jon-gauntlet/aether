// Core system types that form the foundation of the type system

export type SystemState = {
  health: number;  // 0-1 system health indicator
  energy: number;  // 0-1 energy level
  focus: number;   // 0-1 focus level
  context: any;    // Current system context
};

export type FlowState = {
  active: boolean;
  duration: number;
  intensity: number;
  quality: number;
};

export type ProtectionState = {
  immunity: number;     // 0-1 system immunity level
  stability: number;    // 0-1 system stability
  coherence: number;    // 0-1 state coherence
  preservation: number; // 0-1 state preservation
};

export type SystemMetrics = {
  performance: number;
  reliability: number;
  quality: number;
  evolution: number;
};

// Base interfaces
export interface ISystemComponent {
  state: SystemState;
  getHealth(): number;
  evolve(): void;
}

export interface IFlowManager {
  currentFlow: FlowState;
  startFlow(): void;
  maintainFlow(): void;
  endFlow(): FlowState;
}

export interface IProtectionManager {
  protection: ProtectionState;
  checkHealth(): number;
  preserve(): void;
  recover(): void;
}

// Field types
export type FieldConfig = {
  name: string;
  type: string;
  defaultValue?: any;
  validation?: (value: any) => boolean;
};

export type Field<T = any> = {
  name: string;
  type: string;
  value: T;
  isValid: boolean;
  validate: () => boolean;
};

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type SystemConfig = DeepPartial<{
  protection: ProtectionState;
  flow: FlowState;
  metrics: SystemMetrics;
}>;

// Factory functions
export const createDefaultField = <T>(config: FieldConfig): Field<T> => {
  return {
    name: config.name,
    type: config.type,
    value: config.defaultValue as T,
    isValid: true,
    validate: () => config.validation ? config.validation(config.defaultValue) : true
  };
}; 