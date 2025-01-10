import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { SpaceSystem, SpaceType } from './space';

export type PresenceType = 'reading' | 'writing' | 'thinking' | 'listening';
export type FlowState = 'shallow' | 'gathering' | 'deepening' | 'deep' | 'protected';

export interface Stream {
  id: string;
  presenceType?: PresenceType;
  flowState: FlowState;
  presence: number;
  stillness: number;
  depth: number;
  clarity: number;
  resonance: number;
  ascent: number;
  lastActivity?: number;
  timeInState: number;
}

export interface River {
  streams: Stream[];
  depth: number;
  stillness: number;
  presence: number;
  resonance: number;
  harmony: number;
  height: number;
}

export class Flow {
  private streams: Map<string, Stream> = new Map();
  private lastTend: number = Date.now();
  
  constructor() {
    this.tend();
    setInterval(() => this.tend(), 1000);
  }

  private tend() {
    const now = Date.now();
    const elapsed = (now - this.lastTend) / 1000;
    this.lastTend = now;

    this.streams.forEach(stream => {
      // Natural presence decay
      stream.presence *= Math.exp(-elapsed * this.getPresenceDecay(stream));
      
      // Stillness growth
      stream.stillness = Math.min(1, stream.stillness + elapsed * this.getStillnessGrowth(stream));
      
      // Update depth based on presence and stillness
      stream.depth = stream.presence * stream.stillness;
      
      // Calculate clarity based on stillness and depth
      stream.clarity = stream.stillness * (0.5 + 0.5 * stream.depth);
      
      // Calculate resonance with other streams
      stream.resonance = this.calculateResonance(stream);
      
      // Calculate ascent based on clarity and resonance
      stream.ascent = stream.clarity * (0.3 + 0.7 * stream.resonance);
      
      // Update flow state and time in state
      const newFlowState = this.determineFlowState(stream);
      if (newFlowState === stream.flowState) {
        stream.timeInState += elapsed;
      } else {
        stream.timeInState = 0;
        stream.flowState = newFlowState;
      }
    });
  }

  private getPresenceDecay(stream: Stream): number {
    // Base decay rate modified by flow state
    const baseDecay = 0.1;
    switch (stream.flowState) {
      case 'protected': return baseDecay * 0.2;
      case 'deep': return baseDecay * 0.4;
      case 'deepening': return baseDecay * 0.6;
      case 'gathering': return baseDecay * 0.8;
      default: return baseDecay;
    }
  }

  private getStillnessGrowth(stream: Stream): number {
    // Base growth rate modified by presence type
    const baseGrowth = 0.05;
    switch (stream.presenceType) {
      case 'thinking': return baseGrowth * 1.5;
      case 'reading': return baseGrowth * 1.2;
      case 'listening': return baseGrowth * 1.0;
      case 'writing': return baseGrowth * 0.8;
      default: return baseGrowth;
    }
  }

  private calculateResonance(stream: Stream): number {
    let totalResonance = 0;
    let count = 0;

    this.streams.forEach(other => {
      if (other.id !== stream.id) {
        // Base resonance from depth
        let resonance = Math.min(stream.depth, other.depth);
        
        // Enhance resonance for complementary presence types
        if (stream.presenceType && other.presenceType) {
          const affinity = this.getPresenceTypeAffinity(stream.presenceType, other.presenceType);
          resonance *= (1 + affinity);
        }
        
        totalResonance += resonance;
        count++;
      }
    });

    return count > 0 ? totalResonance / count : 0;
  }

  private getPresenceTypeAffinity(type1: PresenceType, type2: PresenceType): number {
    // Define natural affinities between presence types
    const affinities: Record<PresenceType, Record<PresenceType, number>> = {
      reading: { reading: 0.4, writing: 0.3, thinking: 0.5, listening: 0.2 },
      writing: { reading: 0.3, writing: 0.3, thinking: 0.4, listening: 0.2 },
      thinking: { reading: 0.5, writing: 0.4, thinking: 0.6, listening: 0.3 },
      listening: { reading: 0.2, writing: 0.2, thinking: 0.3, listening: 0.4 }
    };

    return affinities[type1]?.[type2] || 0;
  }

  private determineFlowState(stream: Stream): FlowState {
    const { presence, stillness, depth, timeInState } = stream;
    
    // Protected state requires high presence, stillness, and depth maintained over time
    if (presence > 0.8 && stillness > 0.8 && depth > 0.7 && timeInState > 300) {
      return 'protected';
    }
    
    // Deep state requires high presence and stillness
    if (presence > 0.7 && stillness > 0.7 && depth > 0.6) {
      return 'deep';
    }
    
    // Deepening state shows progress towards depth
    if (presence > 0.5 && stillness > 0.5 && depth > 0.4) {
      return 'deepening';
    }
    
    // Gathering state shows initial presence
    if (presence > 0.3) {
      return 'gathering';
    }
    
    return 'shallow';
  }

  public updatePresence(id: string, presenceType: PresenceType) {
    let stream = this.streams.get(id);
    
    if (!stream) {
      stream = {
        id,
        flowState: 'shallow',
        presence: 0,
        stillness: 0,
        depth: 0,
        clarity: 0,
        resonance: 0,
        ascent: 0,
        timeInState: 0
      };
      this.streams.set(id, stream);
    }
    
    stream.presenceType = presenceType;
    stream.presence = 1;
    stream.lastActivity = Date.now();
  }

  public getStream(id: string): Stream | undefined {
    return this.streams.get(id);
  }

  public getOtherStreams(id: string): Stream[] {
    return Array.from(this.streams.values()).filter(s => s.id !== id);
  }
} 