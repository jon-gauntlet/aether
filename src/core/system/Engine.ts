import { BehaviorSubject } from 'rxjs';
import { State, Space, SpaceType } from '../types';
import { ConsciousnessEngine } from './ConsciousnessEngine';

export class Engine {
  private state: BehaviorSubject<State>;
  private consciousness: ConsciousnessEngine;
  
  constructor() {
    this.consciousness = new ConsciousnessEngine();
    this.state = new BehaviorSubject<State>({
      streams: [],
      spaces: []
    });
    
    this.initializeSpaces();
  }

  private initializeSpaces() {
    // Create initial spaces
    const gathering = this.consciousness.createSpace('gathering', 'gathering');
    const deepening = this.consciousness.createSpace('deepening', 'deepening');
    const contemplation = this.consciousness.createSpace('contemplation', 'contemplation');
    const communion = this.consciousness.createSpace('communion', 'communion');
    
    // Connect spaces naturally
    this.consciousness.connect('gathering', 'deepening');
    this.consciousness.connect('deepening', 'contemplation');
    this.consciousness.connect('contemplation', 'communion');
    
    // Update state
    this.state.next({
      ...this.state.value,
      spaces: [gathering, deepening, contemplation, communion]
    });
  }

  public getState(): State {
    return this.state.value;
  }

  public getSpace(id: string): Space | undefined {
    return this.consciousness.getSpace(id);
  }
} 