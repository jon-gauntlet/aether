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
  private _lastAccessed: number;

  constructor(id: string, name: string, path: string) {
    const now = Date.now();
    this._lastAccessed = now;
    this.workspaceSubject = new BehaviorSubject<WorkspaceState>({
      id: id || '',
      name: name || '',
      path: path || '',
      lastAccessed: this._lastAccessed,
      settings: {}
    });
  }

  public observeWorkspace(): Observable<WorkspaceState> {
    return this.workspaceSubject.asObservable();
  }

  public getCurrentState(): WorkspaceState {
    return this.workspaceSubject.value;
  }

  private updateTimestamp(): void {
    const now = Date.now();
    this._lastAccessed = now > this._lastAccessed ? now + 1 : this._lastAccessed + 1;
  }

  public updateSettings(settings: Record<string, any> | null | undefined): void {
    const currentState = this.workspaceSubject.value;
    this.updateTimestamp();
    
    // Handle non-object settings
    const newSettings = settings && typeof settings === 'object' && !Array.isArray(settings)
      ? { ...currentState.settings, ...settings }
      : {};

    this.workspaceSubject.next({
      ...currentState,
      settings: newSettings,
      lastAccessed: this._lastAccessed
    });
  }

  public clearSettings(): void {
    const currentState = this.workspaceSubject.value;
    this.updateTimestamp();
    this.workspaceSubject.next({
      ...currentState,
      settings: {},
      lastAccessed: this._lastAccessed
    });
  }

  public updateName(name: string | undefined): void {
    const currentState = this.workspaceSubject.value;
    this.updateTimestamp();
    this.workspaceSubject.next({
      ...currentState,
      name: name || '',
      lastAccessed: this._lastAccessed
    });
  }

  public updatePath(path: string | undefined): void {
    const currentState = this.workspaceSubject.value;
    this.updateTimestamp();
    this.workspaceSubject.next({
      ...currentState,
      path: path || '',
      lastAccessed: this._lastAccessed
    });
  }

  public touch(): void {
    const currentState = this.workspaceSubject.value;
    this.updateTimestamp();
    this.workspaceSubject.next({
      ...currentState,
      lastAccessed: this._lastAccessed
    });
  }
} 