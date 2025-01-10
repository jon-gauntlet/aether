import { Observable } from 'rxjs';
import { FlowState as BaseFlowState } from './base';
import { EnergyState } from './energy';
import { ContextState } from './context';
import { AutonomicSystem } from '../autonomic/Autonomic';
import { EnergySystem } from '../energy/EnergySystem';

export interface AutonomicState {
  energy: EnergyState;
  flow: BaseFlowState;
  context: ContextState;
  protection: {
    level: number;
    type: string;
  };
  pattern: {
    id: string;
    type: string;
    context: string[];
    states: string[];
  };
}

export interface AutonomicDevelopmentProps {
  flow$: Observable<BaseFlowState>;
  energy$: Observable<EnergyState>;
  context$: Observable<ContextState>;
  autonomic: AutonomicSystem;
  energy: EnergySystem;
  context?: {
    type: string;
  };
} 