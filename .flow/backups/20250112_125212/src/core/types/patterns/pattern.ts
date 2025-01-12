export enum PatternState {
  ACTIVE = 'ACTIVE',
  STABLE = 'STABLE',
  EVOLVING = 'EVOLVING',
  PROTECTED = 'PROTECTED'
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  context: string[];
  energyLevel: number;
  successRate: number;
  states: PatternState[];
}
