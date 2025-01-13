import { Timestamp } from 'firebase/firestore';

export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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
  focus: number;
  productivity: number;
  timeInState: number;
  energyLevel: number;
  flowState: FlowState;
  energyType: EnergyType;
}

export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Field {
  radius: number;
  strength: number;
  waves: Wave[];
}