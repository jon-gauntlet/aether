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

  constructor(id: string, type: ContextState['type'], content: string = '') {
    this.contextSubject = new BehaviorSubject<ContextState>({
      id,
      type,
      content,
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

  public updateContent(content: string): void {
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      content,
      lastModified: Date.now()
    });
  }

  public updateMetadata(metadata: Record<string, any>): void {
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      metadata: { ...currentState.metadata, ...metadata },
      lastModified: Date.now()
    });
  }

  public clearMetadata(): void {
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      metadata: {},
      lastModified: Date.now()
    });
  }

  public updateType(type: ContextState['type']): void {
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      type,
      lastModified: Date.now()
    });
  }

  public touch(): void {
    const currentState = this.contextSubject.value;
    this.contextSubject.next({
      ...currentState,
      lastModified: Date.now()
    });
  }
} 