import { SystemState, ProtectionState } from './base';

export type SpaceType = 'sanctuary' | 'library' | 'garden' | 'workshop' | 'commons';

export interface SpaceConfig {
  type: SpaceType;
  name: string;
  description: string;
  protection: Partial<ProtectionState>;
}

export interface Space {
  id: string;
  config: SpaceConfig;
  state: SystemState;
  isActive: boolean;
  lastAccessed: number;
}

export interface SpaceTransition {
  from: SpaceType;
  to: SpaceType;
  timestamp: number;
  preserveState?: boolean;
}

export type SpaceNavigation = {
  currentSpace: Space;
  history: SpaceTransition[];
  canTransition: (to: SpaceType) => boolean;
  transition: (to: SpaceType) => Promise<boolean>;
}; 