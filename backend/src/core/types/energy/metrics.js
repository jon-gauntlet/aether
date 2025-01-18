export interface EnergyMetricsConfig {
  minLevel: number;
  maxLevel: number;
  baseCapacity: number;
  recoveryRate: number;
  sustainabilityThreshold: number;
  efficiencyFactor: number;
}

export interface EnergyMetricsSnapshot {
  timestamp: number;
  level: number;
  capacity: number;
  recovery: number;
  sustainability: number;
  efficiency: number;
}

export interface EnergyMetricsHistory {
  snapshots: EnergyMetricsSnapshot[];
  config: EnergyMetricsConfig;
}

export interface EnergyMetricsAnalytics {
  averageLevel: number;
  peakLevel: number;
  minLevel: number;
  recoveryRate: number;
  sustainabilityScore: number;
  efficiencyScore: number;
} 