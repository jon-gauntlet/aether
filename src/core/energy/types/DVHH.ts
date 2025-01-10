import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy } from '../energy/types';

export interface Thought {
  id: string;
  content: string;
  type: 'INSIGHT' | 'PATTERN' | 'REFLECTION' | 'DECISION';
  timestamp: Date;
  context: {
    flowState: FlowState;
    energy: Energy;
    metrics: {
      clarity: number;
      depth: number;
      relevance: number;
      impact: number;
    };
  };
  tags: string[];
}

export interface ThoughtStreamState {
  isActive: boolean;
  currentThought: Thought | null;
  thoughts: Thought[];
  metrics: {
    clarity: number;
    depth: number;
    coherence: number;
    flow: number;
  };
}

export class ThoughtStreamSystem {
  private state$: BehaviorSubject<ThoughtStreamState>;
  private readonly MAX_THOUGHTS = 1000;
  private readonly COHERENCE_THRESHOLD = 0.7;

  constructor() {
    this.state$ = new BehaviorSubject<ThoughtStreamState>({
      isActive: false,
      currentThought: null,
      thoughts: [],
      metrics: {
        clarity: 1.0,
        depth: 1.0,
        coherence: 1.0,
        flow: 1.0
      }
    });
  }

  public getState(): Observable<ThoughtStreamState> {
    return this.state$.asObservable();
  }

  public activate(): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      isActive: true
    });
  }

  public deactivate(): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      isActive: false,
      currentThought: null
    });
  }

  public addThought(
    content: string,
    type: 'INSIGHT' | 'PATTERN' | 'REFLECTION' | 'DECISION',
    consciousness: ConsciousnessState,
    tags: string[] = []
  ): void {
    const currentState = this.state$.getValue();
    if (!currentState.isActive) return;

    const thought: Thought = {
      id: this.generateId(),
      content,
      type,
      timestamp: new Date(),
      context: {
        flowState: consciousness.currentState,
        energy: consciousness.energy,
        metrics: {
          clarity: consciousness.metrics.clarity,
          depth: consciousness.metrics.depth,
          relevance: this.calculateRelevance(content, tags, currentState.thoughts),
          impact: this.calculateImpact(type, consciousness)
        }
      },
      tags
    };

    const updatedThoughts = this.addToStream(currentState.thoughts, thought);
    const metrics = this.calculateStreamMetrics(updatedThoughts, consciousness);

    this.state$.next({
      ...currentState,
      currentThought: thought,
      thoughts: updatedThoughts,
      metrics
    });
  }

  public findRelatedThoughts(
    content: string,
    tags: string[],
    limit: number = 5
  ): Thought[] {
    const currentState = this.state$.getValue();
    if (!currentState.isActive) return [];

    return currentState.thoughts
      .map(thought => ({
        thought,
        relevance: this.calculateThoughtRelevance(content, tags, thought)
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(result => result.thought);
  }

  public getThoughtsByType(
    type: 'INSIGHT' | 'PATTERN' | 'REFLECTION' | 'DECISION'
  ): Thought[] {
    const currentState = this.state$.getValue();
    return currentState.thoughts.filter(t => t.type === type);
  }

  public synchronize(consciousness: ConsciousnessState): void {
    const currentState = this.state$.getValue();
    if (!currentState.isActive) return;

    const metrics = this.calculateStreamMetrics(
      currentState.thoughts,
      consciousness
    );

    this.state$.next({
      ...currentState,
      metrics
    });
  }

  private calculateStreamMetrics(
    thoughts: Thought[],
    consciousness: ConsciousnessState
  ): {
    clarity: number;
    depth: number;
    coherence: number;
    flow: number;
  } {
    if (thoughts.length === 0) {
      return {
        clarity: consciousness.metrics.clarity,
        depth: consciousness.metrics.depth,
        coherence: 1.0,
        flow: consciousness.metrics.flexibility
      };
    }

    const recentThoughts = thoughts.slice(-10);
    const avgClarity = recentThoughts.reduce((sum, t) =>
      sum + t.context.metrics.clarity, 0
    ) / recentThoughts.length;

    const avgDepth = recentThoughts.reduce((sum, t) =>
      sum + t.context.metrics.depth, 0
    ) / recentThoughts.length;

    const coherence = this.calculateCoherence(recentThoughts);
    const flow = this.calculateFlow(recentThoughts, consciousness);

    return {
      clarity: Math.min(1, avgClarity),
      depth: Math.min(1, avgDepth),
      coherence: Math.min(1, coherence),
      flow: Math.min(1, flow)
    };
  }

  private calculateRelevance(
    content: string,
    tags: string[],
    existingThoughts: Thought[]
  ): number {
    if (existingThoughts.length === 0) return 1;

    const recentThoughts = existingThoughts.slice(-5);
    const tagMatches = recentThoughts.reduce((sum, thought) =>
      sum + thought.tags.filter(t => tags.includes(t)).length, 0
    );

    const contentRelevance = recentThoughts.reduce((sum, thought) =>
      sum + this.calculateContentSimilarity(content, thought.content), 0
    ) / recentThoughts.length;

    return (
      contentRelevance * 0.7 +
      (tagMatches / (5 * Math.max(1, tags.length))) * 0.3
    );
  }

  private calculateImpact(
    type: 'INSIGHT' | 'PATTERN' | 'REFLECTION' | 'DECISION',
    consciousness: ConsciousnessState
  ): number {
    const baseImpact = {
      INSIGHT: 0.8,
      PATTERN: 0.7,
      REFLECTION: 0.6,
      DECISION: 0.9
    }[type];

    return baseImpact * consciousness.metrics.depth;
  }

  private calculateCoherence(thoughts: Thought[]): number {
    if (thoughts.length < 2) return 1;

    let coherenceScore = 0;
    for (let i = 1; i < thoughts.length; i++) {
      const prev = thoughts[i - 1];
      const curr = thoughts[i];

      const tagCoherence = prev.tags.filter(t =>
        curr.tags.includes(t)
      ).length / Math.max(prev.tags.length, curr.tags.length);

      const timeCoherence = Math.min(1,
        300000 / (curr.timestamp.getTime() - prev.timestamp.getTime())
      );

      coherenceScore += (
        tagCoherence * 0.6 +
        timeCoherence * 0.4
      );
    }

    return coherenceScore / (thoughts.length - 1);
  }

  private calculateFlow(
    thoughts: Thought[],
    consciousness: ConsciousnessState
  ): number {
    const timeBetweenThoughts = thoughts.slice(1).map((thought, i) =>
      thought.timestamp.getTime() - thoughts[i].timestamp.getTime()
    );

    if (timeBetweenThoughts.length === 0) return consciousness.metrics.flexibility;

    const avgTime = timeBetweenThoughts.reduce((sum, time) =>
      sum + time, 0
    ) / timeBetweenThoughts.length;

    const timeVariance = Math.sqrt(
      timeBetweenThoughts.reduce((sum, time) =>
        sum + Math.pow(time - avgTime, 2), 0
      ) / timeBetweenThoughts.length
    );

    const flowRegularity = 1 - Math.min(1, timeVariance / avgTime);
    return (
      flowRegularity * 0.6 +
      consciousness.metrics.flexibility * 0.4
    );
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple word overlap similarity for now
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    return intersection.size / Math.max(words1.size, words2.size);
  }

  private addToStream(thoughts: Thought[], thought: Thought): Thought[] {
    const updatedThoughts = [...thoughts, thought];
    if (updatedThoughts.length > this.MAX_THOUGHTS) {
      return updatedThoughts.slice(-this.MAX_THOUGHTS);
    }
    return updatedThoughts;
  }

  private generateId(): string {
    return `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 