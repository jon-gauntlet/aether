import { FlowState, ProtectionLevel } from '../primitives/base';
import { FlowMetrics } from '../primitives/metrics';
import type { Field } from '../field';

export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Resonance {
  frequency: number;
  amplitude: number;
  phase: number;
  stability: number;
}

export interface AdvancedFlow extends FlowMetrics {
  resonance: Resonance[];
  field: Field;
  waves: Wave[];
  protection: ProtectionLevel;
}

export function isAdvancedFlow(obj: any): obj is AdvancedFlow {
  return (
    obj &&
    Array.isArray(obj.resonance) &&
    typeof obj.protection === 'string' &&
    obj.field &&
    Array.isArray(obj.waves)
  );
}

export interface HasProtection {
  protection: ProtectionLevel;
}

export function isResonating(flow: AdvancedFlow): boolean {
  return flow?.resonance?.length > 0;
}