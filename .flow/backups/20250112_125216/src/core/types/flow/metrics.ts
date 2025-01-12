import { FlowMetrics as BaseFlowMetrics } from '../../../types/base';

// Base flow metrics that form the foundation of flow measurement
export interface FlowMetrics {
  // Core metrics
  velocity: number;    // Speed of flow state progression
  momentum: number;    // Sustained flow intensity
  resistance: number;  // Barriers to flow
  conductivity: number; // Ease of entering flow

  // Extended metrics
  focus: number;      // Mental concentration
  energy: number;     // Available resources
  clarity: number;    // Mental acuity
  quality: number;    // Overall flow quality
}

// Default values for flow metrics
export const DEFAULT_FLOW_METRICS: FlowMetrics = {
  // Core metrics
  velocity: 0.8,
  momentum: 0.8,
  resistance: 0.2,
  conductivity: 0.8,

  // Extended metrics
  focus: 0.9,
  energy: 0.85,
  clarity: 0.9,
  quality: 0.85
};

// Utility functions for metrics
export const isOptimalMetrics = (metrics: FlowMetrics): boolean => {
  return Object.values(metrics).every(value => 
    value >= 0.8 || (metrics.resistance === value && value <= 0.2)
  );
};

export const calculateMetricsAverage = (metrics: FlowMetrics): number => {
  const values = Object.values(metrics).filter(value => value !== metrics.resistance);
  const resistanceContribution = 1 - metrics.resistance;
  return (values.reduce((sum, value) => sum + value, 0) + resistanceContribution) / (values.length + 1);
};

export const calculateFlowQuality = (metrics: FlowMetrics): number => {
  const weights = {
    velocity: 0.2,
    momentum: 0.2,
    resistance: -0.15,
    conductivity: 0.15,
    focus: 0.1,
    energy: 0.1,
    clarity: 0.1
  };

  return Object.entries(weights).reduce((quality, [key, weight]) => {
    const value = metrics[key as keyof FlowMetrics];
    return quality + (key === 'resistance' ? (1 - value) * weight : value * weight);
  }, 0);
};
