export enum EnergyType {
  Mental = 'mental',
  Physical = 'physical',
  Emotional = 'emotional',
  Creative = 'creative'
}

export enum FlowState {
  Normal = 'normal',
  Flow = 'flow',
  Exhausted = 'exhausted',
  Recovering = 'recovering'
}

export interface EnergyMeta {
  timestamp: Date;
  duration: number;
  source: string;
  triggers: string[];
  notes: string;
}

export interface Energy {
  current: number;
  max: number;
  type: EnergyType;
  flow: FlowState;
  meta: EnergyMeta;
} 