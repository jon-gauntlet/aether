import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { RepoEvolution } from './RepoEvolution';

interface OptimizationState {
  patterns: Map<string, number>;    // Usage patterns and their strength
  flows: Map<string, string[]>;     // Optimized flow paths
  hotspots: Set<string>;           // Areas needing optimization
  improvements: Map<string, string>;// Suggested improvements
}

export class ContinuousOptimization {
  private state: BehaviorSubject<OptimizationState>;
  private repo: RepoEvolution;
  private readonly OPTIMIZATION_INTERVAL = 5000; // 5 seconds

  constructor(repo: RepoEvolution) {
    this.repo = repo;
    this.state = new BehaviorSubject<OptimizationState>({
      patterns: new Map(),
      flows: new Map(),
      hotspots: new Set(),
      improvements: new Map()
    });

    // Start continuous optimization
    this.beginOptimization();
  }

  private beginOptimization() {
    // Continuously observe and optimize
    interval(this.OPTIMIZATION_INTERVAL).pipe(
      mergeMap(() => this.repo.observeEvolution()),
      map(repoState => this.optimize(repoState))
    ).subscribe(optimizations => {
      this.state.next(optimizations);
    });
  }

  private optimize(repoState: any): OptimizationState {
    const currentState = this.state.value;
    
    // Detect usage patterns
    repoState.activeAreas.forEach((energy: number, path: string) => {
      const currentStrength = currentState.patterns.get(path) || 0;
      currentState.patterns.set(path, currentStrength + energy);
    });

    // Optimize flow paths
    repoState.codeFlows.forEach((connections: string[], path: string) => {
      const optimizedFlow = this.optimizeFlow(connections);
      currentState.flows.set(path, optimizedFlow);
    });

    // Identify optimization hotspots
    repoState.energyCenters.forEach((energy: number, path: string) => {
      if (energy > 0.8) {
        currentState.hotspots.add(path);
      }
    });

    // Generate improvement suggestions
    currentState.hotspots.forEach(hotspot => {
      const suggestion = this.generateImprovement(hotspot);
      if (suggestion) {
        currentState.improvements.set(hotspot, suggestion);
      }
    });

    return currentState;
  }

  private optimizeFlow(connections: string[]): string[] {
    // Sort by connection strength
    return connections.sort((a, b) => {
      const strengthA = this.state.value.patterns.get(a) || 0;
      const strengthB = this.state.value.patterns.get(b) || 0;
      return strengthB - strengthA;
    });
  }

  private generateImprovement(path: string): string | null {
    const patterns = this.state.value.patterns;
    const strength = patterns.get(path) || 0;

    if (strength > 0.9) {
      return 'Consider extracting common patterns';
    } else if (strength > 0.7) {
      return 'Optimize frequently used paths';
    } else if (strength > 0.5) {
      return 'Monitor for potential optimizations';
    }

    return null;
  }

  // Get current optimization state
  getOptimizations(): OptimizationState {
    return this.state.value;
  }

  // Get optimization suggestions
  getSuggestions(): Map<string, string> {
    return this.state.value.improvements;
  }

  // Get optimized flow paths
  getOptimizedFlows(): Map<string, string[]> {
    return this.state.value.flows;
  }

  // Observe optimization evolution
  observeOptimizations(): Observable<OptimizationState> {
    return this.state.asObservable();
  }
} 