import { BaseType } from './types/base';

export interface DevAction extends BaseType {
  type: string;
  timestamp: number;
  success: boolean;
}

export class DevOptimizer {
  private actions: DevAction[] = [];

  getActions(): DevAction[] {
    return [...this.actions];
  }

  addAction(action: DevAction): void {
    this.actions.push(action);
  }

  clearActions(): void {
    this.actions = [];
  }
}