import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FlowStateGuardian } from '../flow/FlowStateGuardian';
import { EnergySystem } from '../energy/EnergySystem';
import { PredictiveValidation } from '../autonomic/PredictiveValidation';
import { AutonomicSystem } from '../autonomic/Autonomic';

export class SystemIntegration {
  constructor(
    private flow: FlowStateGuardian,
    private energy: EnergySystem,
    private validation: PredictiveValidation,
    private autonomic: AutonomicSystem
  ) {}

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

  public async validateSystemState(): Promise<boolean> {
    const validation = await this.autonomic.validateState();
    return validation.isValid;
  }
}