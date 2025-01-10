export enum EnergyType {
  Mental = 'Mental',
  Physical = 'Physical',
  Emotional = 'Emotional'
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
} 