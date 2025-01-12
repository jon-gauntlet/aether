import { FlowState, IFlowManager, SystemState } from '../types/base';

export class FlowEngine implements IFlowManager {
  private systemState: SystemState;
  currentFlow: FlowState;

  constructor() {
    this.systemState = {
      health: 1,
      energy: 1,
      focus: 1,
      context: {}
    };

    this.currentFlow = {
      active: false,
      duration: 0,
      intensity: 0,
      quality: 1
    };
  }

  startFlow(): void {
    this.currentFlow = {
      active: true,
      duration: 0,
      intensity: 0.8, // Start at 80% intensity
      quality: 1
    };
    this.preserveContext();
  }

  maintainFlow(): void {
    if (!this.currentFlow.active) return;

    // Update flow metrics
    this.currentFlow.duration += 1;
    this.currentFlow.quality = this.calculateQuality();

    // Check for health issues
    if (this.currentFlow.quality < 0.7) {
      this.suggestBreak();
    }

    this.preserveContext();
  }

  endFlow(): FlowState {
    // Capture final state
    const finalState = {
      ...this.currentFlow,
      active: false
    };

    // Reset flow
    this.currentFlow = {
      active: false,
      duration: 0,
      intensity: 0,
      quality: 1
    };

    // Preserve context before ending
    this.preserveContext();

    return finalState;
  }

  private calculateQuality(): number {
    const energyImpact = Math.max(0, this.systemState.energy);
    const focusImpact = Math.max(0, this.systemState.focus);
    
    return (energyImpact + focusImpact) / 2;
  }

  private preserveContext(): void {
    // Save current context
    this.systemState.context = {
      flow: this.currentFlow,
      timestamp: Date.now()
    };
  }

  private suggestBreak(): void {
    console.log('Flow quality dropping - consider taking a break');
    // Could integrate with a notification system
  }
}

export default FlowEngine; 