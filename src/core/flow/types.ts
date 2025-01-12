import { z } from 'zod';
import { Pattern, PatternSchema } from '../pattern/types';

// Internal types
interface FlowState {
  type: FlowType;
  depth: number;
  duration: number;
  patterns: Pattern[];
}

type FlowType = 'focus' | 'deep' | 'peak' | 'recovery';

interface FlowTransition {
  from: FlowState;
  to: FlowState;
  timestamp: number;
  trigger?: string;
}

interface FlowMetrics {
  averageDepth: number;
  totalDuration: number;
  transitionCount: number;
  recoveryTime: number;
}

// Runtime validation
export const FlowTypeSchema = z.enum(['focus', 'deep', 'peak', 'recovery']);

export const FlowStateSchema = z.object({
  type: FlowTypeSchema,
  depth: z.number().min(0).max(1),
  duration: z.number().min(0),
  patterns: z.array(PatternSchema)
});

export const FlowTransitionSchema = z.object({
  from: FlowStateSchema,
  to: FlowStateSchema,
  timestamp: z.number(),
  trigger: z.string().optional()
});

export const FlowMetricsSchema = z.object({
  averageDepth: z.number(),
  totalDuration: z.number(),
  transitionCount: z.number(),
  recoveryTime: z.number()
});

// Type guards
export const isFlowState = (value: unknown): value is FlowState => {
  return FlowStateSchema.safeParse(value).success;
};

export const isFlowTransition = (value: unknown): value is FlowTransition => {
  return FlowTransitionSchema.safeParse(value).success;
};

// Public types
export type { FlowState, FlowType, FlowTransition, FlowMetrics }; 