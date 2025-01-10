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
    const now = Date.now();
    this.workspaceSubject = new BehaviorSubject<WorkspaceState>({
      id: id || '',
      name: name || '',
      path: path || '',
      lastAccessed: now + 1,
      settings: {}
    });
  }

  public observeWorkspace(): Observable<WorkspaceState> {
    return this.workspaceSubject.asObservable();
  }

  public getCurrentState(): WorkspaceState {
    return this.workspaceSubject.value;
  }

  public updateSettings(settings: Record<string, any> | null | undefined): void {
    const currentState = this.workspaceSubject.value;
    const now = Date.now();
    
    // Handle non-object settings
    const newSettings = settings && typeof settings === 'object' && !Array.isArray(settings)
      ? { ...currentState.settings, ...settings }
      : {};

    this.workspaceSubject.next({
      ...currentState,
      settings: newSettings,
      lastAccessed: now + 1
    });
  }

  public clearSettings(): void {
    const currentState = this.workspaceSubject.value;
    const now = Date.now();
    this.workspaceSubject.next({
      ...currentState,
      settings: {},
      lastAccessed: now + 1
    });
  }

  public updateName(name: string | undefined): void {
    const currentState = this.workspaceSubject.value;
    const now = Date.now();
    this.workspaceSubject.next({
      ...currentState,
      name: name || '',
      lastAccessed: now + 1
    });
  }

  public updatePath(path: string | undefined): void {
    const currentState = this.workspaceSubject.value;
    const now = Date.now();
    this.workspaceSubject.next({
      ...currentState,
      path: path || '',
      lastAccessed: now + 1
    });
  }

  public touch(): void {
    const currentState = this.workspaceSubject.value;
    const now = Date.now();
    this.workspaceSubject.next({
      ...currentState,
      lastAccessed: now + 1
    });
  }
} 