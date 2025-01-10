import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { 
  FlowState, 
  EnergyState,
  Pattern,
  Protection,
  BaseMetrics,
  FlowMetrics,
  NaturalFlowType,
  Field,
  Resonance
} from '../types/base';
import { AutonomicState } from '../types/autonomic';
import { EnergySystem } from '../energy/EnergySystem';
import { FlowStateGuardian } from '../flow/FlowStateGuardian';
import { PatternManager } from './PatternManager';

export class AutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState | null>(null);
  private deploymentValidation$ = new BehaviorSubject<boolean>(false);
  
  constructor(
    private readonly energySystem: EnergySystem,
    private readonly flowGuardian: FlowStateGuardian,
    private readonly patternManager: PatternManager
  ) {
    this.initialize();
  }

  private async initialize() {
    try {
      const energy = await firstValueFrom(this.energySystem.observeEnergy());
      const flow = this.flowGuardian.getCurrentState();
      const pattern = this.patternManager.current;

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

        const resonance: Resonance = {
          frequency: 0.8,
          amplitude: 0.7,
          phase: 0.6,
          coherence: 0.75
        };

        const field: Field = {
          strength: 0.8,
          stability: 0.7,
          coherence: 0.75,
          resonance
        };

        this.state$.next({
          energy: {
            id: energy.id || 'initial',
            level: energy.level || 0.8,
            capacity: energy.capacity || 100,
            protection: energy.protection || 0.8,
            timestamp: energy.timestamp || Date.now(),
            resonance,
            field,
            metrics: {
              level: energy.metrics?.level || 0.8,
              capacity: energy.metrics?.capacity || 100,
              stability: energy.metrics?.stability || 0.7,
              flow: energy.metrics?.flow || 0.75,
              coherence: energy.metrics?.coherence || 0.8
            }
          },
          flow: flowState,
          context: {
            id: 'initial-context',
            type: 'development',
            depth: 0.8,
            presence: 'active',
            flow: 'natural',
            metrics: {
              depth: 0.8,
              presence: 0.7,
              coherence: 0.75,
              stability: 0.8
            },
            protection: {
              level: 0.8,
              type: 'standard'
            },
            timestamp: Date.now()
          },
          protection: {
            level: 0.8,
            type: 'natural'
          },
          pattern: {
            id: pattern.id || 'initial',
            type: pattern.type || 'stable',
            context: pattern.context || [],
            states: pattern.states || []
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