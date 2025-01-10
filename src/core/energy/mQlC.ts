import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState, FlowType } from '../types/flow';
import { StreamId } from '../types/stream';

export class FlowEngine {
  private stateSubject: BehaviorSubject<FlowState>;
  private validTypes = ['natural', 'guided', 'resonant'] as const;
  private _timestamp: number;

  constructor() {
    this._timestamp = Date.now();
    this.stateSubject = new BehaviorSubject<FlowState>({
      type: 'natural',
      depth: 0,
      energy: 0,
      focus: 0,
      timestamp: this._timestamp
    });
  }

  public get timestamp(): number {
    return this._timestamp;
  }

  private updateTimestamp(): void {
    const now = Date.now();
    this._timestamp = now + 1;
  }

  public setMode(type: FlowType): void {
    if (!this.validTypes.includes(type)) {
      throw new Error(`Invalid flow type: ${type}`);
    }

    this.updateTimestamp();
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      type,
      timestamp: this._timestamp
    });
  }

  public observeState(): Observable<FlowState> {
    return this.stateSubject.asObservable();
  }

  public getCurrentState(): FlowState {
    return this.stateSubject.value;
  }

  public notice(streamId: StreamId, message: string): void {
    this.updateTimestamp();
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      timestamp: this._timestamp
    });
  }

  public wake(streamId: StreamId): void {
    this.updateTimestamp();
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      timestamp: this._timestamp
    });
  }

  public updateDepth(depth: number): void {
    this.updateTimestamp();
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      depth,
      timestamp: this._timestamp
    });
  }

  public updateEnergy(energy: number): void {
    this.updateTimestamp();
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      energy,
      timestamp: this._timestamp
    });
  }

  public updateFocus(focus: number): void {
    this.updateTimestamp();
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      focus,
      timestamp: this._timestamp
    });
  }
}