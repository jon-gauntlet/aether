import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

interface RepoState {
  activeAreas: Map<string, number>;  // Areas of high activity
  codeFlows: Map<string, string[]>;  // Natural code paths
  growthPatterns: Set<string>;       // Emerging patterns
  energyCenters: Map<string, number>;// High energy areas
}

interface FileActivity {
  path: string;
  type: 'create' | 'modify' | 'delete';
  connections: string[];             // Related files
  energy: number;                    // Activity level
}

export class RepoEvolution {
  private state: BehaviorSubject<RepoState>;
  private readonly ENERGY_THRESHOLD = 0.7;
  private readonly CONNECTION_STRENGTH = 0.1;

  constructor() {
    this.state = new BehaviorSubject<RepoState>({
      activeAreas: new Map(),
      codeFlows: new Map(),
      growthPatterns: new Set(),
      energyCenters: new Map()
    });
  }

  // Record natural file activity
  recordActivity(activity: FileActivity) {
    const currentState = this.state.value;
    
    // Update active areas
    const currentEnergy = currentState.activeAreas.get(activity.path) || 0;
    currentState.activeAreas.set(
      activity.path, 
      currentEnergy + (activity.energy || 1)
    );

    // Strengthen connections
    const currentFlows = currentState.codeFlows.get(activity.path) || [];
    const newFlows = new Set([...currentFlows, ...activity.connections]);
    currentState.codeFlows.set(activity.path, Array.from(newFlows));

    // Detect patterns
    if (activity.energy > this.ENERGY_THRESHOLD) {
      currentState.growthPatterns.add(`high_activity_${activity.type}`);
    }

    // Update energy centers
    activity.connections.forEach(conn => {
      const energy = currentState.energyCenters.get(conn) || 0;
      currentState.energyCenters.set(conn, energy + this.CONNECTION_STRENGTH);
    });

    this.state.next(currentState);
  }

  // Get natural growth suggestions
  getGrowthSuggestions(): string[] {
    const state = this.state.value;
    const suggestions: string[] = [];

    // Suggest based on energy centers
    Array.from(state.energyCenters.entries())
      .filter(([_, energy]) => energy > this.ENERGY_THRESHOLD)
      .forEach(([path]) => {
        suggestions.push(`Consider evolving: ${path}`);
      });

    // Suggest based on patterns
    state.growthPatterns.forEach(pattern => {
      suggestions.push(`Emerging pattern: ${pattern}`);
    });

    return suggestions;
  }

  // Get natural file connections
  getFileConnections(filePath: string): string[] {
    return this.state.value.codeFlows.get(filePath) || [];
  }

  // Get high energy areas
  getEnergyCenters(): string[] {
    const state = this.state.value;
    return Array.from(state.energyCenters.entries())
      .filter(([_, energy]) => energy > this.ENERGY_THRESHOLD)
      .map(([path]) => path);
  }

  // Natural cleanup of stale patterns
  private cleanupStalePatterns() {
    const state = this.state.value;
    
    // Reduce energy in inactive areas
    state.activeAreas.forEach((energy, path) => {
      if (energy < 0.1) {
        state.activeAreas.delete(path);
      } else {
        state.activeAreas.set(path, energy * 0.9);
      }
    });

    // Remove weak connections
    state.codeFlows.forEach((connections, path) => {
      const activeConns = connections.filter(conn => 
        (state.energyCenters.get(conn) || 0) > 0.2
      );
      if (activeConns.length === 0) {
        state.codeFlows.delete(path);
      } else {
        state.codeFlows.set(path, activeConns);
      }
    });

    this.state.next(state);
  }

  // Observe repository evolution
  observeEvolution(): Observable<RepoState> {
    return this.state.asObservable();
  }
} 