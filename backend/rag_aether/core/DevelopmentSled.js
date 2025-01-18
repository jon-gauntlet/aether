import { FlowEngine } from './FlowEngine';
import { TypeOptimizer } from './TypeOptimizer';
import { TypeProtection } from './protection/TypeProtection';
import { 
  FlowState, 
  FlowStats, 
  EnergyMetrics, 
  Pattern 
} from './types/base';

export class DevelopmentSled {
  private flowEngine: FlowEngine;
  private typeOptimizer: TypeOptimizer;
  private typeProtection: TypeProtection;

  constructor(
    flowEngine: FlowEngine,
    typeOptimizer: TypeOptimizer,
    typeProtection: TypeProtection
  ) {
    this.flowEngine = flowEngine;
    this.typeOptimizer = typeOptimizer;
    this.typeProtection = typeProtection;
  }

  // Flow State Management
  async enterFlow(depth: number = 1, isProtected: boolean = false): Promise<void> {
    await this.flowEngine.enterFlow(depth, isProtected);
  }

  async exitFlow(active: boolean = true, isProtected: boolean = false): Promise<void> {
    await this.flowEngine.exitFlow(active, isProtected);
  }

  // Energy Management
  updateEnergy(metrics: EnergyMetrics): void {
    this.flowEngine.updateEnergy(metrics);
  }

  updateMetrics(metrics: FlowStats): void {
    this.flowEngine.updateMetrics(metrics);
  }

  // Type Optimization with Protection
  async optimizeTypes(): Promise<void> {
    if (this.canOptimize()) {
      await this.typeOptimizer.optimizeTypes();
    }
  }

  // Status Reporting
  getStatus(
    energy: EnergyMetrics,
    metrics: FlowStats,
    typeMetrics: any,
    protection: boolean
  ): Pattern[] {
    return this.flowEngine.getPatterns();
  }

  // Utility Methods
  isInFlow(): boolean {
    return this.flowEngine.isInFlow();
  }

  canOptimize(): boolean {
    return this.typeProtection.canOptimize();
  }
}