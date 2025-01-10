import { BehaviorSubject, Observable } from 'rxjs';

export interface NavigationState {
  currentPath: string;
  previousPath?: string;
  params: Record<string, string>;
  timestamp: number;
}

export class Navigator {
  private navigationSubject: BehaviorSubject<NavigationState>;

  constructor(initialPath: string = '/') {
    this.navigationSubject = new BehaviorSubject<NavigationState>({
      currentPath: initialPath,
      params: {},
      timestamp: Date.now()
    });
  }

  public navigate(path: string, params: Record<string, string> = {}): void {
    const previousState = this.navigationSubject.value;
    this.navigationSubject.next({
      currentPath: path,
      previousPath: previousState.currentPath,
      params,
      timestamp: Date.now()
    });
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
      this.navigate(currentState.previousPath);
    }
  }

  public updateParams(params: Record<string, string>): void {
    const currentState = this.navigationSubject.value;
    this.navigationSubject.next({
      ...currentState,
      params: { ...currentState.params, ...params },
      timestamp: Date.now()
    });
  }

  public clearParams(): void {
    const currentState = this.navigationSubject.value;
    this.navigationSubject.next({
      ...currentState,
      params: {},
      timestamp: Date.now()
    });
  }
} 