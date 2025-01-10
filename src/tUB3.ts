import { Energy, EnergyMetrics } from '../energy/types';

export function calculateEnergyEfficiency(energy: Energy, metrics: EnergyMetrics): number {
  const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
  const sustainabilityFactor = metrics.sustainability * 0.4;
  const recoveryFactor = metrics.recovery * 0.3;
  const efficiencyFactor = metrics.efficiency * 0.3;

  return Math.max(0, Math.min(1,
    avgEnergy * (sustainabilityFactor + recoveryFactor + efficiencyFactor)
  ));
}

export function calculateEnergySustainability(
  current: Energy,
  previous: Energy,
  metrics: EnergyMetrics
): number {
  const mentalDelta = Math.abs(current.mental - previous.mental);
  const physicalDelta = Math.abs(current.physical - previous.physical);
  const emotionalDelta = Math.abs(current.emotional - previous.emotional);

  const totalDelta = (mentalDelta + physicalDelta + emotionalDelta) / 3;
  const stabilityFactor = 1 - totalDelta;
  
  return Math.max(0, Math.min(1,
    stabilityFactor * metrics.sustainability + metrics.recovery * 0.2
  ));
}

export function optimizeEnergyDistribution(
  energy: Energy,
  metrics: EnergyMetrics,
  targetEfficiency: number
): Energy {
  const currentEfficiency = calculateEnergyEfficiency(energy, metrics);
  
  if (currentEfficiency >= targetEfficiency) return energy;

  const adjustment = (targetEfficiency - currentEfficiency) * 0.2;
  const recoveryBonus = metrics.recovery * adjustment;

  return {
    mental: Math.min(1, energy.mental + adjustment + recoveryBonus),
    physical: Math.min(1, energy.physical + adjustment),
    emotional: Math.min(1, energy.emotional + adjustment + recoveryBonus * 0.5)
  };
}

export function calculateEnergyRecoveryRate(
  energy: Energy,
  metrics: EnergyMetrics,
  timeDelta: number
): number {
  const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
  const baseRecoveryRate = metrics.recovery * 0.1;
  const sustainabilityBonus = metrics.sustainability * 0.05;
  const efficiencyPenalty = (1 - metrics.efficiency) * 0.05;

  return Math.max(0, Math.min(1,
    baseRecoveryRate + sustainabilityBonus - efficiencyPenalty
  )) * (timeDelta / 1000); // Convert ms to seconds
}

export function predictEnergyDepletion(
  energy: Energy,
  metrics: EnergyMetrics,
  intensity: number
): number {
  const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
  const baseDepleteRate = intensity * 0.1;
  const sustainabilityBonus = metrics.sustainability * 0.05;
  const efficiencyBonus = metrics.efficiency * 0.05;

  const depletionRate = Math.max(0, baseDepleteRate - sustainabilityBonus - efficiencyBonus);
  const timeToDepletion = avgEnergy / depletionRate;

  return Math.max(0, timeToDepletion * 1000); // Convert to milliseconds
} 