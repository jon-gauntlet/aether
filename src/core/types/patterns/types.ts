export interface Pattern {
  id: string;
  name: string;
  description: string;
  energyLevel: number;
  successRate: number;
  context: string[];
  states: PatternState[];
}

export enum PatternState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROTECTED = 'PROTECTED',
  EVOLVING = 'EVOLVING',
  STABLE = 'STABLE'
