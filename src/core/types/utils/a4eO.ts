import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';

export interface PredictionMetrics {
  flowAlignment: number;
  resonanceHarmony: number;
  protectionIntegrity: number;
  consciousnessAlignment: number;
}

export interface PredictionResult {
  isValid: boolean;
  confidence: number;
  metrics: PredictionMetrics;
}

const calculateFlowAlignment = (field: Field): number => {
  const { velocity, momentum, resistance, conductivity } = field.flowMetrics;
  return (velocity * momentum * conductivity * (1 - resistance));
};

const calculateResonanceHarmony = (field: Field): number => {
  const { amplitude, harmonics } = field.resonance;
  const harmonicStrength = harmonics.reduce((sum, h) => sum + h, 0) / harmonics.length;
  return amplitude * harmonicStrength;
};

const calculateProtectionIntegrity = (field: Field): number => {
  const { shields, recovery, resilience, adaptability } = field.protection;
  return (shields * recovery * resilience * adaptability) ** 0.25;
};

const calculateConsciousnessAlignment = (consciousness: ConsciousnessState): number => {
  const { clarity, coherence, depth, integration, flexibility } = consciousness.metrics;
  return (clarity * coherence * depth * integration * flexibility) ** 0.2;
};

export const validatePrediction = (field: Field, consciousness: ConsciousnessState): PredictionResult => {
  const flowAlignment = calculateFlowAlignment(field);
  const resonanceHarmony = calculateResonanceHarmony(field);
  const protectionIntegrity = calculateProtectionIntegrity(field);
  const consciousnessAlignment = calculateConsciousnessAlignment(consciousness);

  const metrics: PredictionMetrics = {
    flowAlignment,
    resonanceHarmony,
    protectionIntegrity,
    consciousnessAlignment
  };

  const confidence = (
    field.strength * 0.3 +
    flowAlignment * 0.3 +
    resonanceHarmony * 0.2 +
    protectionIntegrity * 0.1 +
    consciousnessAlignment * 0.1
  );

  return {
    isValid: confidence > 0.7,
    confidence,
    metrics
  };
