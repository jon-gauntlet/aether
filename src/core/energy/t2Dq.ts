import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
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
        this.state$.next({
          energy,
          flow,
          context: {
            type: 'development',
            patterns: [],
            current: ''
          },
          protection: {
            level: 1,
            type: 'natural'
          },
          pattern: {
            id: pattern.id,
            type: pattern.type,
            context: pattern.context,
            states: []
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
        state.flow.quality > 0.5 &&
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