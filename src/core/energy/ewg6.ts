import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { 
  FlowState, 
  EnergyState,
  Pattern,
  Protection,
  BaseMetrics,
  FlowMetrics,
  NaturalFlowType
} from '../types/base';
import { AutonomicState } from '../types/autonomic';
import { EnergySystem } from '../energy/EnergySystem';
import { FlowGuardian } from '../flow/FlowGuardian';
import { PatternManager } from './PatternManager';

export class AutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState | null>(null);
  private deploymentValidation$ = new BehaviorSubject<boolean>(false);
  
  constructor(
    private readonly energySystem: EnergySystem,
    private readonly flowGuardian: FlowGuardian,
    private readonly patternManager: PatternManager
  ) {
    this.initialize();
  }

  private async initialize() {
    try {
      const energy = await firstValueFrom(this.energySystem.observeEnergy());
      const flow = await firstValueFrom(this.flowGuardian.observeFlow());
      const pattern = await firstValueFrom(this.patternManager.currentPattern$);

      if (energy && flow && pattern) {
        const baseMetrics: BaseMetrics = {
          intensity: 0.8,
          coherence: 0.7,
          resonance: 0.75,
          presence: 0.8,
          harmony: 0.7,
          rhythm: 0.6
        };

        const flowMetrics: FlowMetrics = {
          ...baseMetrics,
          depth: 0.7,
          clarity: 0.8,
          stability: 0.75,
          focus: 0.8,
          energy: 0.7,
          quality: 0.75
        };

        const protection: Protection = {
          level: 0.8,
          type: 'natural',
          strength: 0.75
        };

        const flowState: FlowState = {
          id: 'initial-flow',
          type: 'natural' as NaturalFlowType,
          metrics: flowMetrics,
          protection,
          timestamp: Date.now()
        };

        this.state$.next({
          energy: {
            current: energy.current,
            max: energy.max,
            level: energy.level,
            type: energy.type,
            efficiency: energy.efficiency,
            phase: energy.phase,
            lastTransition: energy.lastTransition,
            recoveryRate: energy.recoveryRate,
            decayRate: energy.decayRate
          },
          flow: flowState,
          context: {
            type: 'development',
            current: pattern.context[0] || ''
          },
          protection,
          pattern: {
            id: pattern.id,
            type: pattern.metrics.quality > 0.7 ? 'stable' : 'emerging',
            context: pattern.context,
            states: pattern.states.map(s => s.toString())
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize autonomic system:', error);
    }
  }

  async validateDeployment(): Promise<boolean> {
    try {
      const state = this.state$.value;
      const isValid = state !== null && 
        state.energy.level > 0 &&
        state.flow.metrics.quality > 0.5 &&
        state.pattern.id !== '';
        
      this.deploymentValidation$.next(isValid);
      return isValid;
    } catch (error) {
      console.error('Deployment validation failed:', error);
      this.deploymentValidation$.next(false);
      return false;
    }
  }

  observeDeploymentStatus(): Observable<boolean> {
    return this.deploymentValidation$.asObservable();
  }

  observeState(): Observable<AutonomicState | null> {
    return this.state$.asObservable();
  }
} 