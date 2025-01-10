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

  constructor(id: string, type: ContextState['type'], content: string = '') {
    if (!this.validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${this.validTypes.join(', ')}`);
    }

    this.contextSubject = new BehaviorSubject<ContextState>({
      id,
      type,
      content: content || '',
      metadata: {},
      lastModified: Date.now()
    });
  }

  public observeContext(): Observable<ContextState> {
    return this.contextSubject.asObservable();
  }

  public getCurrentState(): ContextState {
    return this.contextSubject.value;
  }

  public updateContent(content: string | undefined | null): void {
    const currentState = this.contextSubject.value;
    const now = Date.now();
    this.contextSubject.next({
      ...currentState,
      content: content || '',
      lastModified: now + 1
    });
  }

  public updateMetadata(metadata: Record<string, any> | null): void {
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      metadata = {};
    }
    
    const currentState = this.contextSubject.value;
    const now = Date.now();
    this.contextSubject.next({
      ...currentState,
      metadata: metadata ? { ...currentState.metadata, ...metadata } : {},
      lastModified: now + 1
    });
  }

  public clearMetadata(): void {
    const currentState = this.contextSubject.value;
    const now = Date.now();
    this.contextSubject.next({
      ...currentState,
      metadata: {},
      lastModified: now + 1
    });
  }

  public updateType(type: ContextState['type']): void {
    if (!this.validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${this.validTypes.join(', ')}`);
    }

    const currentState = this.contextSubject.value;
    const now = Date.now();
    this.contextSubject.next({
      ...currentState,
      type,
      lastModified: now + 1
    });
  }

  public touch(): void {
    const currentState = this.contextSubject.value;
    const now = Date.now();
    this.contextSubject.next({
      ...currentState,
      lastModified: now + 1
    });
  }
} 