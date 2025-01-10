import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FlowStateGuardian } from '../flow/FlowStateGuardian';
import { EnergySystem } from '../energy/EnergySystem';
import { PredictiveValidation } from '../autonomic/PredictiveValidation';
import { AutonomicSystem } from '../autonomic/Autonomic';
import { SpaceTransition, SpaceType } from '../space/SpaceTransition';

export class SystemIntegration {
  private spaceTransition: SpaceTransition;

  constructor(
    private flow: FlowStateGuardian,
    private energy: EnergySystem,
    private validation: PredictiveValidation,
    private autonomic: AutonomicSystem
  ) {
    this.spaceTransition = new SpaceTransition(autonomic);
  }

  public getPresenceMetrics(): Observable<{
    presence: number;
    resonance: number;
    depth: number;
  }> {
    return this.autonomic.getPresenceMetrics();
  }

  public getFlowMetrics(): Observable<{
    quality: number;
    sustainability: number;
    harmony: number;
  }> {
    return this.autonomic.getFlowMetrics();
  }

  public getEnergyMetrics(): Observable<{
    current: number;
    recovery: number;
    balance: number;
  }> {
    return this.autonomic.getEnergyMetrics();
  }

  public getSpaceMetrics(): Observable<{
    type: SpaceType;
    stillness: number;
    presence: number;
    resonance: number;
    protection: number;
  }> {
    return this.spaceTransition.observeSpace();
  }

  public getTransitionMetrics(): Observable<{
    naturalness: number;
    harmony: number;
    stability: number;
  }> {
    return this.spaceTransition.observeTransitionMetrics();
  }

  public async validateSystemState(): Promise<{
    isValid: boolean;
    insights: string[];
  }> {
    const [autonomicValidation, spaceValidation] = await Promise.all([
      this.autonomic.validateState(),
      this.spaceTransition.validateSpaceState()
    ]);

    return {
      isValid: autonomicValidation.isValid && spaceValidation.isValid,
      insights: [...autonomicValidation.insights, ...spaceValidation.insights]
    };
  }
}