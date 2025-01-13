import { FlowState } from './types/base';

export class DebugProtection {
  private isDebugMode: boolean = false;
  private flowState: FlowState;

  setFlowState(state: FlowState): void {
    this.flowState = { ...state };
  }

  getFlowState(): FlowState {
    return { ...this.flowState };
  }

  startDebugging(): void {
    this.isDebugMode = true;
    if (this.flowState) {
      this.flowState.protection = 1;
    }
  }

  endDebugging(): void {
    this.isDebugMode = false;
    if (this.flowState) {
      this.flowState.protection = 0;
    }
  }

  isProtected(): boolean {
    return this.flowState?.protection > 0;
  }

  saveCheckpoint(): void {
    // Future implementation
  }

  restoreCheckpoint(): void {
    // Future implementation
  }
}