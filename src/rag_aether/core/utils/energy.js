import { EnergyMetrics } from '@types/energy';

export function calculateEnergyScore(metrics: EnergyMetrics): number {
  const sustainabilityFactor = metrics.sustainability * 0.4;
  const recoveryFactor = metrics.recovery * 0.3;
  const efficiencyFactor = metrics.efficiency * 0.3;

  return sustainabilityFactor + recoveryFactor + efficiencyFactor;
}

export function calculateEnergyLevel(metrics: EnergyMetrics): number {
  return metrics.level * metrics.capacity;
}

export function calculateEnergyCapacity(metrics: EnergyMetrics): number {
  return metrics.capacity * metrics.efficiency;
}

export function calculateEnergyStability(metrics: EnergyMetrics): number {
  const stabilityFactor = 0.8;
  return (
    stabilityFactor * metrics.sustainability + metrics.recovery * 0.2
  );
}

export function calculateEnergyRecovery(
  metrics: EnergyMetrics,
  adjustment: number = 1
): number {
  const recoveryBonus = metrics.recovery * adjustment;
  return Math.min(1, metrics.level + recoveryBonus);
}

export function isEnergized(metrics: EnergyMetrics): boolean {
  return (
    metrics.level > 0.7 &&
    metrics.sustainability > 0.6 &&
    metrics.efficiency > 0.5
  );
}

export function calculateRecoveryRate(metrics: EnergyMetrics): number {
  const baseRecoveryRate = metrics.recovery * 0.1;
  const sustainabilityBonus = metrics.sustainability * 0.05;
  const efficiencyPenalty = (1 - metrics.efficiency) * 0.05;

  return baseRecoveryRate + sustainabilityBonus - efficiencyPenalty;
}

export function calculateDrainRate(metrics: EnergyMetrics): number {
  const baseDrainRate = 0.1;
  const sustainabilityBonus = metrics.sustainability * 0.05;
  const efficiencyBonus = metrics.efficiency * 0.05;

  return Math.max(0, baseDrainRate - sustainabilityBonus - efficiencyBonus);
} 