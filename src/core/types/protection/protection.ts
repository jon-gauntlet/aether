// Protection level enumeration
export enum ProtectionLevel {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Maximum = 4
}

// Protection state interface
export interface ProtectionState {
  active: boolean;
  metrics: ProtectionMetrics;
  lastCheck: number;
  violations: number;
  flowShieldActive: boolean;
}

// Protection configuration
export interface ProtectionConfig {
  autoActivate: boolean;
  thresholds: {
    stability: number;
    resilience: number;
    integrity: number;
    immunity: number;
  };
  recovery: {
    rate: number;
    interval: number;
  };
}

// Protection event
export interface ProtectionEvent {
  id: string;
  type: 'breach' | 'recovery' | 'strengthen' | 'weaken';
  timestamp: string;
  level: ProtectionLevel;
  duration?: number;
}

// Protection metrics
export interface ProtectionMetrics {
  stability: number;
  resilience: number;
  integrity: number;
  immunity: number;
}

// Type guards
export const isProtectionState = (state: any): state is ProtectionState => {
  return (
    typeof state === 'object' &&
    typeof state.active === 'boolean' &&
    typeof state.metrics === 'object' &&
    typeof state.lastCheck === 'number' &&
    typeof state.violations === 'number' &&
    typeof state.flowShieldActive === 'boolean'
  );
};

export const isProtectionEvent = (event: any): event is ProtectionEvent => {
  return (
    typeof event === 'object' &&
    typeof event.id === 'string' &&
    ['breach', 'recovery', 'strengthen', 'weaken'].includes(event.type) &&
    typeof event.timestamp === 'string' &&
    typeof event.level === 'number'
  );
};
