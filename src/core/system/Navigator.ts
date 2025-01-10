import { BehaviorSubject, Observable } from 'rxjs';

export interface NavigationState {
  currentPath: string;
  previousPath?: string;
  params: Record<string, string>;
  timestamp: number;
}

export class Navigator {
  private navigationSubject: BehaviorSubject<NavigationState>;
  private navigationHistory: Array<NavigationState> = [];

  constructor(initialPath: string = '/') {
    const initialState = {
      currentPath: initialPath,
      params: {},
      timestamp: Date.now()
    };
    this.navigationSubject = new BehaviorSubject<NavigationState>(initialState);
    this.navigationHistory.push(initialState);
  }

  public navigate(path: string, params: Record<string, string> = {}): void {
    const previousState = this.navigationSubject.value;
    const newState = {
      currentPath: path,
      previousPath: previousState.currentPath,
      params,
      timestamp: Date.now()
    };
    this.navigationSubject.next(newState);
    this.navigationHistory.push(newState);
  }

  public observeNavigation(): Observable<NavigationState> {
    return this.navigationSubject.asObservable();
  }

  public getCurrentState(): NavigationState {
    return this.navigationSubject.value;
  }

  public goBack(): void {
    const currentState = this.navigationSubject.value;
    if (currentState.previousPath) {
      // Find the previous state in history
      const previousState = this.navigationHistory[this.navigationHistory.length - 2];
      if (previousState) {
        // Remove current state from history
        this.navigationHistory.pop();
        // Navigate back with preserved params
        this.navigationSubject.next({
          ...previousState,
          timestamp: Date.now()
        });
      } else {
        // Fallback to simple back navigation
        this.navigate(currentState.previousPath, currentState.params);
      }
    }
  }

  public updateParams(params: Record<string, string>): void {
    const currentState = this.navigationSubject.value;
    const newState = {
      ...currentState,
      params: { ...currentState.params, ...params },
      timestamp: Date.now()
    };
    this.navigationSubject.next(newState);
    // Update the last history entry
    if (this.navigationHistory.length > 0) {
      this.navigationHistory[this.navigationHistory.length - 1] = newState;
    }
  }

  public clearParams(): void {
    const currentState = this.navigationSubject.value;
    const newState = {
      ...currentState,
      params: {},
      timestamp: Date.now()
    };
    this.navigationSubject.next(newState);
    // Update the last history entry
    if (this.navigationHistory.length > 0) {
      this.navigationHistory[this.navigationHistory.length - 1] = newState;
    }
  }
} 