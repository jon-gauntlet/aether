import { BehaviorSubject, Observable } from 'rxjs';
import { ConsciousnessState, SystemMeta, Field, NaturalFlow } from '../types/base';
import { StateManager } from '../consciousness/StateManager';
import { createDefaultField } from '../factories/field';
import { createEmptyNaturalFlow } from '../factories/flow';

export class SystemIntegration {
  private stateManager: StateManager;

  constructor(meta: SystemMeta) {
    this.stateManager = new StateManager(meta);
  }

  async evolveState(next: NaturalFlow): Promise<void> {
    await this.stateManager.updateState({ flow: next });
  }

  observe(): Observable<ConsciousnessState> {
    return this.stateManager.observe();
  }

  observeField(): Observable<Field> {
    return this.stateManager.observeField();
  }

  destroy(): void {
    this.stateManager.destroy();
  }
}