import { FlowMetrics, FlowState } from './base';

export type FlowType = 'natural' | 'guided' | 'resonant';

export interface Flow extends FlowState {
  type: FlowType;
  metrics: FlowMetrics;
}