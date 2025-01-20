import { z } from 'zod';

/**
 * @typedef {Object} EnergyMetrics
 * @property {number} strength
 * @property {number} resonance
 * @property {number} frequency
 */

/**
 * @typedef {Object} EnergyState
 * @property {EnergyMetrics} current
 * @property {EnergyMetrics} baseline
 * @property {EnergyMetrics[]} peaks
 */

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

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export const isEnergyMetrics = (value) => {
  return EnergyMetricsSchema.safeParse(value).success;
};

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export const isEnergyState = (value) => {
  return EnergyStateSchema.safeParse(value).success;
}; 