import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { 
  AutonomicState,
  EnergyState,
  FlowState,
  Pattern
} from '../types/base';
import { EnergySystem } from '../energy/EnergySystem';
import { FlowGuardian } from '../flow/FlowGuardian';
import { PatternManager } from './PatternManager';

export class AutonomicSystem {
  private deploymentValidation$ = new BehaviorSubject<boolean>(false);
  
  constructor(
    private readonly energySystem: EnergySystem,
    private readonly flowGuardian: FlowGuardian,
    private readonly patternManager: PatternManager
  ) {}

  async validateDeployment(): Promise<boolean> {
    try {
      const energy = await firstValueFrom(this.energySystem.observeEnergy());
      const flow = await firstValueFrom(this.flowGuardian.observeFlow());
      const patterns = await firstValueFrom(this.patternManager.observePatterns());
      
      const isValid = 
        energy?.current > 0 &&
        flow?.quality > 0.5 &&
        Array.isArray(patterns) &&
        patterns.length > 0;
        
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
} 