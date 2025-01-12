import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FlowSpace, MindSpace, FlowMetrics } from '../types/base';

export interface Member {
  id: string;
  name: string;
  role: string;
  space?: FlowSpace;
}

export interface Room {
  id: string;
  name: string;
  type: string;
  members: Member[];
  space?: FlowSpace;
}

export interface Stage {
  id: string;
  name: string;
  type: string;
  rooms: Room[];
  space?: FlowSpace;
}

export interface State {
  id: string;
  name: string;
  type: string;
  stages: Stage[];
  space?: FlowSpace;
}

export class Progress {
  private stateSubject: BehaviorSubject<State>;

  constructor(initialState: State) {
    this.stateSubject = new BehaviorSubject<State>(initialState);
  }

  observe(): Observable<State> {
    return this.stateSubject.asObservable();
  }

  observeMetrics(): Observable<FlowMetrics> {
    return this.stateSubject.pipe(
      map(state => state.space?.metrics ?? {
        depth: 0,
        harmony: 0,
        energy: 0,
        presence: 0,
        resonance: 0,
        coherence: 0,
        rhythm: 0
      })
    );
  }

  updateState(changes: Partial<State>): void {
    const current = this.stateSubject.getValue();
    this.stateSubject.next({
      ...current,
      ...changes
    });
  }

  destroy(): void {
    this.stateSubject.complete();
  }
}