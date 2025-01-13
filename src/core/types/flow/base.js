import { FlowState, ProtectionLevel } from '../primitives/base';
import { FlowMetrics } from '../primitives/metrics';
import type { Field } from '../field';

export interface AdvancedFlowMetrics extends FlowMetrics {
  field: Field;
  resonance: number;
  conductivity: number;
  resistance: number;
}

export interface ConsciousnessState {
  energy: number;
  focus: number;
  clarity: number;
  coherence: number;
  protection: number;
}

export interface FlowSpace {
  dimensions: number;
  capacity: number;
  stability: number;
  resonance: number;
  fields: Field[];
}

export function isConsciousnessState(obj: any): obj is ConsciousnessState {
  return (
    obj &&
    typeof obj.energy === 'number' &&
    typeof obj.focus === 'number' &&
    typeof obj.clarity === 'number' &&
    typeof obj.coherence === 'number' &&
    typeof obj.protection === 'number'
  );
}