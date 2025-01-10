import { BehaviorSubject, Observable } from 'rxjs';

export interface ContextState {
  id: string;
  type: 'system' | 'user' | 'hidden';
  content: string;
  metadata: Record<string, any>;
  lastModified: number;
}

export class Context {
  private contextSubject: BehaviorSubject<ContextState>;
  private validTypes = ['system', 'user', 'hidden'] as const;
  private _lastModified: number;

  constructor(id: string, type: ContextState['type'], content: string = '') {
    if (!this.validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${this.validTypes.join(', ')}`);
    }

    this._lastModified = Date.now();
    this.contextSubject = new BehaviorSubject<ContextState>({
      id,
      type,
      content: content || '',
      metadata: {},
      lastModified: this._lastModified
    });
  }

  public observeContext(): Observable<ContextState> {
    return this.contextSubject.asObservable();
  }

  public getCurrentState(): ContextState {
    return this.contextSubject.value;
  }

  private updateTimestamp(): void {
    const now = Date.now();
    this._lastModified = Math.max(now, this._lastModified + 1);
  }

  public updateContent(content: string | undefined | null): void {
    this.updateTimestamp();
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      content: content || '',
      lastModified: this._lastModified
    });
  }

  public updateMetadata(metadata: Record<string, any> | null): void {
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      metadata = {};
    }
    
    this.updateTimestamp();
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      metadata: metadata ? { ...currentState.metadata, ...metadata } : {},
      lastModified: this._lastModified
    });
  }

  public clearMetadata(): void {
    this.updateTimestamp();
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      metadata: {},
      lastModified: this._lastModified
    });
  }

  public updateType(type: ContextState['type']): void {
    if (!this.validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${this.validTypes.join(', ')}`);
    }

    this.updateTimestamp();
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      type,
      lastModified: this._lastModified
    });
  }

  public touch(): void {
    this.updateTimestamp();
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      lastModified: this._lastModified
    });
  }
} 