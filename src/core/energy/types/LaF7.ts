export enum EnergyType {
  MENTAL = 'MENTAL',
  PHYSICAL = 'PHYSICAL',
  EMOTIONAL = 'EMOTIONAL'
}

export interface Energy {
  mental: number;
  physical: number;
  emotional: number;
}

export interface EnergyMetrics {
  efficiency: number;
  sustainability: number;
  recovery: number;
  adaptability: number;
  stability: number;
}

export enum EnergyState {
  OPTIMAL = 'OPTIMAL',
  STABLE = 'STABLE',
  RECOVERING = 'RECOVERING',
  DEPLETED = 'DEPLETED'
} 