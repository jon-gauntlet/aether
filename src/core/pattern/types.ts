import { z } from 'zod';
import { EnergyMetricsSchema } from '../energy/types';

// Internal types
interface Pattern {
  id: string;
  name: string;
  energy: {
    required: number;
    current: number;
  };
  state: PatternState;
}

interface PatternState {
  active: boolean;
  strength: number;
  stability: number;
  evolution: number;
}

// Runtime validation
export const PatternStateSchema = z.object({
  active: z.boolean(),
  strength: z.number().min(0).max(1),
  stability: z.number().min(0).max(1),
  evolution: z.number().min(0)
});

export const PatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  energy: z.object({
    required: z.number().min(0),
    current: z.number().min(0)
  }),
  state: PatternStateSchema
});

// Type guards
export const isPattern = (value: unknown): value is Pattern => {
  return PatternSchema.safeParse(value).success;
};

export const isPatternState = (value: unknown): value is PatternState => {
  return PatternStateSchema.safeParse(value).success;
};

// Public types
export type { Pattern, PatternState }; 