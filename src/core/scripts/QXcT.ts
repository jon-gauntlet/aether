import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { SpaceSystem, SpaceType } from './space';

export type PresenceType = 'reading' | 'writing' | 'thinking' | 'listening';
export type FlowState = 'shallow' | 'gathering' | 'deepening' | 'deep' | 'protected';

export interface Stream {
  id: string;
  depth: number;
  stillness: number;
  presence: number;
  resonance: number;
  clarity: number;
  presenceType?: PresenceType;
  lastActivity: number;
  flowState: FlowState;
  timeInState: number;
  currentSpace?: string;  // ID of current space
}

export interface River {
  streams: Stream[];
  depth: number;
  stillness: number;
  presence: number;
  resonance: number;
}

export class Flow {
  private streams = new Map<string, BehaviorSubject<Stream>>();
  private lastTend = Date.now();
  private spaceSystem: SpaceSystem;
  
  constructor(spaceSystem: SpaceSystem) {
    this.spaceSystem = spaceSystem;
    timer(0, 1000).subscribe(() => {
      const now = Date.now();
      const delta = (now - this.lastTend) / 1000;
      this.lastTend = now;
      this.tend(delta);
    });
  }

  private tend(delta: number) {
    const now = Date.now();
    this.streams.forEach(subject => {
      const stream = subject.value;
      
      // Get space qualities if in a space
      const spaceQualities = stream.currentSpace ? 
        this.spaceSystem.getSpaceQuality(stream.currentSpace) : undefined;
      
      // Update time in current flow state
      const timeInState = stream.timeInState + delta;
      
      // Natural presence cycles, adjusted for flow state and space
      const timeSinceActivity = (now - stream.lastActivity) / 1000;
      const presenceDecay = this.getPresenceDecay(timeSinceActivity, stream.presenceType) * 
        this.getFlowProtection(stream.flowState) *
        (spaceQualities ? 1 - spaceQualities.presenceGather * 0.3 : 1);
      const presence = Math.max(0, stream.presence - presenceDecay * delta);
      
      // Stillness grows differently based on presence type, flow state, and space
      const stillnessGrowth = this.getStillnessGrowth(stream.presenceType) * 
        this.getFlowEnhancement(stream.flowState) *
        (spaceQualities ? 1 + spaceQualities.stillnessSupport * 0.3 : 1);
      const stillness = Math.min(1, stream.stillness + (1 - presence) * stillnessGrowth * delta);
      
      // Depth and clarity, influenced by space
      const depthLimit = spaceQualities ? spaceQualities.depthCapacity : 1;
      const depth = Math.min(depthLimit, (stream.depth * 3 + stillness) / 4);
      const clarity = (stream.clarity * 2 + (stillness + depth) / 2) / 3;
      
      // Resonance between streams, enhanced by space
      const resonance = this.calculateResonance(stream) *
        (spaceQualities ? 1 + spaceQualities.resonanceFlow * 0.2 : 1);
      
      // Determine new flow state
      const flowState = this.determineFlowState(stream, presence, stillness, depth, timeInState);
      
      subject.next({
        ...stream,
        presence,
        stillness,
        depth,
        clarity,
        resonance,
        flowState,
        timeInState: flowState === stream.flowState ? timeInState : 0
      });
    });
  }

  private getFlowProtection(state: FlowState): number {
    // Reduce presence decay in deeper states
    switch (state) {
      case 'shallow': return 1;
      case 'gathering': return 0.8;
      case 'deepening': return 0.6;
      case 'deep': return 0.4;
      case 'protected': return 0.2;
    }
  }

  private getFlowEnhancement(state: FlowState): number {
    // Enhance stillness growth in deeper states
    switch (state) {
      case 'shallow': return 1;
      case 'gathering': return 1.2;
      case 'deepening': return 1.4;
      case 'deep': return 1.6;
      case 'protected': return 2;
    }
  }

  private determineFlowState(
    stream: Stream,
    presence: number,
    stillness: number,
    depth: number,
    timeInState: number
  ): FlowState {
    const currentState = stream.flowState;
    const qualityScore = (presence + stillness + depth) / 3;

    // State transition logic
    switch (currentState) {
      case 'shallow':
        if (qualityScore > 0.6) return 'gathering';
        break;
      case 'gathering':
        if (qualityScore < 0.5) return 'shallow';
        if (qualityScore > 0.7 && timeInState > 60) return 'deepening';
        break;
      case 'deepening':
        if (qualityScore < 0.6) return 'gathering';
        if (qualityScore > 0.8 && timeInState > 120) return 'deep';
        break;
      case 'deep':
        if (qualityScore < 0.7) return 'deepening';
        if (qualityScore > 0.9 && timeInState > 300) return 'protected';
        break;
      case 'protected':
        if (qualityScore < 0.8) return 'deep';
        break;
    }

    return currentState;
  }

  private getPresenceDecay(timeSinceActivity: number, type?: PresenceType): number {
    const baseDecay = 0.05;
    if (!type) return baseDecay;

    switch (type) {
      case 'reading':
        return baseDecay * (timeSinceActivity > 5 ? 2 : 0.7);
      case 'writing':
        return baseDecay * (timeSinceActivity > 10 ? 1.5 : 0.5);
      case 'thinking':
        return baseDecay * 0.8;
      case 'listening':
        return baseDecay * (timeSinceActivity > 3 ? 2.5 : 0.6);
      default:
        return baseDecay;
    }
  }

  private getStillnessGrowth(type?: PresenceType): number {
    const baseGrowth = 0.1;
    if (!type) return baseGrowth;

    switch (type) {
      case 'reading':
        return baseGrowth * 1.2;
      case 'writing':
        return baseGrowth * 0.8;
      case 'thinking':
        return baseGrowth * 1.5;
      case 'listening':
        return baseGrowth * 1.3;
      default:
        return baseGrowth;
    }
  }

  private calculateResonance(stream: Stream): number {
    const natural = Math.max(0, stream.resonance - 0.03);
    
    const others = Array.from(this.streams.values())
      .map(s => s.value)
      .filter(s => s.id !== stream.id);
    
    if (others.length === 0) return natural;
    
    const shared = others.reduce((sum, other) => {
      const presenceMatch = 1 - Math.abs(stream.presence - other.presence);
      const depthMatch = 1 - Math.abs(stream.depth - other.depth);
      const typeMatch = stream.presenceType && other.presenceType && 
        this.getPresenceTypeAffinity(stream.presenceType, other.presenceType);
      
      return sum + (presenceMatch + depthMatch + (typeMatch || 0)) / (typeMatch ? 3 : 2);
    }, 0) / others.length;
    
    return Math.min(1, (natural + shared) / 2);
  }

  private getPresenceTypeAffinity(a: PresenceType, b: PresenceType): number {
    const affinities: Record<PresenceType, Record<PresenceType, number>> = {
      reading: {
        reading: 0.7,
        writing: 0.4,
        thinking: 0.9,
        listening: 0.5
      },
      writing: {
        reading: 0.4,
        writing: 0.3,
        thinking: 0.6,
        listening: 0.2
      },
      thinking: {
        reading: 0.9,
        writing: 0.6,
        thinking: 1.0,
        listening: 0.8
      },
      listening: {
        reading: 0.5,
        writing: 0.2,
        thinking: 0.8,
        listening: 0.9
      }
    };
    
    return affinities[a]?.[b] ?? 0.5;
  }

  observe(id: string): Observable<Stream | undefined> {
    return this.getStream(id).pipe(
      map(stream => stream || undefined)
    );
  }

  notice(id: string, type?: PresenceType) {
    const subject = this.getStream(id);
    const stream = subject.value;
    
    subject.next({
      ...stream,
      presence: Math.min(1, stream.presence + 0.2),
      stillness: Math.max(0, stream.stillness - 0.1),
      resonance: Math.min(1, stream.resonance + 0.1),
      presenceType: type ?? stream.presenceType,
      lastActivity: Date.now()
    });
  }

  private getStream(id: string): BehaviorSubject<Stream> {
    let subject = this.streams.get(id);
    if (!subject) {
      subject = new BehaviorSubject<Stream>({
        id,
        depth: 0,
        stillness: 0,
        presence: 0,
        resonance: 0,
        clarity: 0,
        lastActivity: Date.now(),
        flowState: 'shallow',
        timeInState: 0
      });
      this.streams.set(id, subject);
    }
    return subject;
  }

  enterSpace(streamId: string, spaceId: string): void {
    const subject = this.streams.get(streamId);
    if (!subject) return;

    const stream = subject.value;
    if (stream.currentSpace) {
      this.spaceSystem.leave(stream.currentSpace, streamId);
    }
    
    this.spaceSystem.enter(spaceId, streamId);
    
    subject.next({
      ...stream,
      currentSpace: spaceId
    });
  }

  leaveSpace(streamId: string): void {
    const subject = this.streams.get(streamId);
    if (!subject) return;

    const stream = subject.value;
    if (stream.currentSpace) {
      this.spaceSystem.leave(stream.currentSpace, streamId);
      
      subject.next({
        ...stream,
        currentSpace: undefined
      });
    }
  }
} 