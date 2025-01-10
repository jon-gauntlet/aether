import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

interface FlowState {
  depth: number;           // Current depth level (0-1)
  energy: number;          // Current energy level (0-1)
  focus: number;          // Current focus intensity (0-1)
  activity: string[];     // Current active flows
}

interface FlowTransition {
  from: Partial<FlowState>;
  to: Partial<FlowState>;
  duration: number;       // Transition time in ms
}

export class NaturalFlow {
  private state: BehaviorSubject<FlowState>;
  private transitions: BehaviorSubject<FlowTransition[]>;
  
  private readonly DEPTH_THRESHOLD = 0.7;
  private readonly ENERGY_DECAY = 0.95;
  private readonly MIN_TRANSITION_TIME = 300;

  constructor() {
    this.state = new BehaviorSubject<FlowState>({
      depth: 0,
      energy: 1,
      focus: 0,
      activity: []
    });

    this.transitions = new BehaviorSubject<FlowTransition[]>([]);
  }

  // Natural state transitions
  async transitionTo(newState: Partial<FlowState>) {
    const currentState = this.state.value;
    const transition: FlowTransition = {
      from: { ...currentState },
      to: newState,
      duration: this.calculateTransitionTime(currentState, newState)
    };

    // Record transition for pattern learning
    const currentTransitions = this.transitions.value;
    this.transitions.next([...currentTransitions, transition]);

    // Smoothly transition state
    await this.smoothTransition(transition);
  }

  // Calculate natural transition time based on state change magnitude
  private calculateTransitionTime(
    current: FlowState,
    target: Partial<FlowState>
  ): number {
    const depthChange = Math.abs((target.depth ?? current.depth) - current.depth);
    const energyChange = Math.abs((target.energy ?? current.energy) - current.energy);
    const focusChange = Math.abs((target.focus ?? current.focus) - current.focus);

    const maxChange = Math.max(depthChange, energyChange, focusChange);
    return Math.max(this.MIN_TRANSITION_TIME, maxChange * 1000);
  }

  // Smooth state transition
  private async smoothTransition(transition: FlowTransition) {
    const steps = Math.ceil(transition.duration / 16); // ~60fps
    const currentState = { ...this.state.value };

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const newState: FlowState = {
        depth: this.interpolate(currentState.depth, transition.to.depth ?? currentState.depth, progress),
        energy: this.interpolate(currentState.energy, transition.to.energy ?? currentState.energy, progress),
        focus: this.interpolate(currentState.focus, transition.to.focus ?? currentState.focus, progress),
        activity: currentState.activity
      };

      this.state.next(newState);
      await new Promise(resolve => setTimeout(resolve, 16));
    }
  }

  // Natural value interpolation
  private interpolate(start: number, end: number, progress: number): number {
    // Use cubic easing for natural feel
    const t = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    return start + (end - start) * t;
  }

  // Observe depth changes
  observeDepth(): Observable<number> {
    return this.state.pipe(
      map(state => state.depth),
      distinctUntilChanged()
    );
  }

  // Observe energy changes
  observeEnergy(): Observable<number> {
    return this.state.pipe(
      map(state => state.energy),
      distinctUntilChanged()
    );
  }

  // Observe focus changes
  observeFocus(): Observable<number> {
    return this.state.pipe(
      map(state => state.focus),
      distinctUntilChanged()
    );
  }

  // Get learned transition patterns
  getTransitionPatterns(): FlowTransition[] {
    return this.transitions.value
      .filter(t => 
        Math.abs((t.to.depth ?? 0) - (t.from.depth ?? 0)) > this.DEPTH_THRESHOLD
      );
  }

  // Natural energy decay
  private decayEnergy() {
    const currentState = this.state.value;
    if (currentState.energy > 0.1) {
      this.state.next({
        ...currentState,
        energy: currentState.energy * this.ENERGY_DECAY
      });
    }
  }

  // Start natural flow
  startFlow(activity: string) {
    const currentState = this.state.value;
    if (!currentState.activity.includes(activity)) {
      this.state.next({
        ...currentState,
        activity: [...currentState.activity, activity],
        energy: Math.min(1, currentState.energy + 0.2)
      });
    }
  }

  // End natural flow
  endFlow(activity: string) {
    const currentState = this.state.value;
    this.state.next({
      ...currentState,
      activity: currentState.activity.filter(a => a !== activity),
      energy: Math.max(0, currentState.energy - 0.1)
    });
  }
} 