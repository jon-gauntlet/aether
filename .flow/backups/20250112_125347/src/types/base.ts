export enum FlowState {
  FOCUS = 'FOCUS',
  FLOW = 'FLOW',
  HYPERFOCUS = 'HYPERFOCUS',
  RECOVERING = 'RECOVERING',
  EXHAUSTED = 'EXHAUSTED',
  DISTRACTED = 'DISTRACTED'
}

export enum EnergyType {
  MENTAL = 'MENTAL',
  PHYSICAL = 'PHYSICAL',
  EMOTIONAL = 'EMOTIONAL'
}

export interface FlowMetrics {
  velocity: number;
  momentum: number;
  resistance: number;
  conductivity: number;
} 