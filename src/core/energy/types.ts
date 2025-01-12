import { z } from 'zod';

// Internal types
interface EnergyMetrics {
  strength: number;
  resonance: number;
  frequency: number;
}

interface EnergyState {
  current: EnergyMetrics;
  baseline: EnergyMetrics;
  peaks: EnergyMetrics[];
}

// Runtime validation
export const EnergyMetricsSchema = z.object({
  strength: z.number().min(0).max(1),
  resonance: z.number().min(0).max(1), 
  frequency: z.number()
});

export const EnergyStateSchema = z.object({
  current: EnergyMetricsSchema,
  baseline: EnergyMetricsSchema,
  peaks: z.array(EnergyMetricsSchema)
});

// Type guards
export const isEnergyMetrics = (value: unknown): value is EnergyMetrics => {
  return EnergyMetricsSchema.safeParse(value).success;
};

export const isEnergyState = (value: unknown): value is EnergyState => {
  return EnergyStateSchema.safeParse(value).success;
};

// Public types
export type { EnergyMetrics, EnergyState }; 