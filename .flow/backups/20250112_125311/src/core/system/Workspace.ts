import { BehaviorSubject, Observable } from 'rxjs';

export interface WorkspaceState {
  id: string;
  name: string;
  path: string;
  lastAccessed: number;
  settings: Record<string, any>;
}

export class Workspace {
  private workspaceSubject: BehaviorSubject<WorkspaceState>;

  constructor(id: string, name: string, path: string) {
    this.workspaceSubject = new BehaviorSubject<WorkspaceState>({
      id,
      name,
      path,
      lastAccessed: Date.now(),
      settings: {}
    });
  }

  public observeWorkspace(): Observable<WorkspaceState> {
    return this.workspaceSubject.asObservable();
  }

  public getCurrentState(): WorkspaceState {
    return this.workspaceSubject.value;
  }

  public updateSettings(settings: Record<string, any>): void {
    const currentState = this.workspaceSubject.value;
    this.workspaceSubject.next({
      ...currentState,
      settings: { ...currentState.settings, ...settings },
      lastAccessed: Date.now()
    });
  }

  public clearSettings(): void {
    const currentState = this.workspaceSubject.value;
    this.workspaceSubject.next({
      ...currentState,
      settings: {},
      lastAccessed: Date.now()
    });
  }

  public updateName(name: string): void {
    const currentState = this.workspaceSubject.value;
    this.workspaceSubject.next({
      ...currentState,
      name,
      lastAccessed: Date.now()
    });
  }

  public updatePath(path: string): void {
    const currentState = this.workspaceSubject.value;
    this.workspaceSubject.next({
      ...currentState,
      path,
      lastAccessed: Date.now()
    });
  }

  public touch(): void {
    const currentState = this.workspaceSubject.value;
    this.workspaceSubject.next({
      ...currentState,
      lastAccessed: Date.now()
    });
  }
} 