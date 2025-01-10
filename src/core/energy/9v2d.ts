import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { FlowState, FlowLevel, FlowSession } from '../types/flow';
import { Pattern, StoredPattern } from '../types/patterns';

interface EnergyState {
  flowState: FlowState;
  flowLevel: FlowLevel;
  isProtected: boolean;
  activePatterns: Pattern[];
  flowHistory: FlowSession[];
  currentSession?: FlowSession;
}

export class EnergySystem {
  private state$ = new BehaviorSubject<EnergyState>({
    flowState: 'rest',
    flowLevel: 'medium',
    isProtected: false,
    activePatterns: [],
    flowHistory: [],
    currentSession: undefined
  });

  // Flow State Management
  getFlowState(): Observable<FlowState> {
    return this.state$.pipe(map(state => state.flowState));
  }

  setFlowState(state: FlowState): void {
    if (!this.state$.value.isProtected) {
      this.endCurrentSession();
      this.startNewSession(state);
      
      this.state$.next({
        ...this.state$.value,
        flowState: state
      });
    }
  }

  // Flow Level Management
  getFlowLevel(): Observable<FlowLevel> {
    return this.state$.pipe(map(state => state.flowLevel));
  }

  setFlowLevel(level: FlowLevel): void {
    if (!this.state$.value.isProtected) {
      if (this.state$.value.currentSession) {
        this.updateCurrentSession({ level });
      }
      
      this.state$.next({
        ...this.state$.value,
        flowLevel: level
      });
    }
  }

  // Flow Protection
  protectFlow(): void {
    if (this.state$.value.flowLevel === 'high') {
      if (this.state$.value.currentSession) {
        this.updateCurrentSession({ isProtected: true });
      }
      
      this.state$.next({
        ...this.state$.value,
        isProtected: true
      });
      
      setTimeout(() => {
        if (this.state$.value.flowLevel !== 'high') {
          this.releaseFlow();
        }
      }, 30 * 60 * 1000); // 30 minutes
    }
  }

  releaseFlow(): void {
    if (this.state$.value.currentSession) {
      this.updateCurrentSession({ isProtected: false });
    }
    
    this.state$.next({
      ...this.state$.value,
      isProtected: false
    });
  }

  // Session Management
  private startNewSession(state: FlowState): void {
    const session: FlowSession = {
      id: uuidv4(),
      state,
      level: this.state$.value.flowLevel,
      startTime: new Date().toISOString(),
      metrics: {
        duration: 0,
        intensity: 0,
        quality: 0
      },
      patterns: this.state$.value.activePatterns.map(p => p.id)
    };

    this.state$.next({
      ...this.state$.value,
      currentSession: session
    });
  }

  private endCurrentSession(): void {
    const { currentSession } = this.state$.value;
    if (currentSession) {
      const endedSession: FlowSession = {
        ...currentSession,
        endTime: new Date().toISOString(),
        metrics: this.calculateSessionMetrics(currentSession)
      };

      this.state$.next({
        ...this.state$.value,
        flowHistory: [...this.state$.value.flowHistory, endedSession],
        currentSession: undefined
      });
    }
  }

  private updateCurrentSession(updates: Partial<FlowSession>): void {
    if (this.state$.value.currentSession) {
      this.state$.next({
        ...this.state$.value,
        currentSession: {
          ...this.state$.value.currentSession,
          ...updates
        }
      });
    }
  }

  private calculateSessionMetrics(session: FlowSession) {
    const startTime = new Date(session.startTime);
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
    
    const patterns = this.state$.value.activePatterns.filter(p => 
      session.patterns.includes(p.id)
    );
    
    const intensity = patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length;
    const quality = patterns.reduce((sum, p) => sum + (1 - p.evolution.entropyLevel), 0) / patterns.length;

    return {
      duration,
      intensity,
      quality
    };
  }

  // Pattern Management
  getActivePatterns(): Observable<Pattern[]> {
    return this.state$.pipe(map(state => state.activePatterns));
  }

  addPattern(pattern: Omit<Pattern, 'id'>): void {
    const newPattern: Pattern = {
      ...pattern,
      id: uuidv4()
    };

    this.state$.next({
      ...this.state$.value,
      activePatterns: [...this.state$.value.activePatterns, newPattern]
    });
  }

  removePattern(id: string): void {
    this.state$.next({
      ...this.state$.value,
      activePatterns: this.state$.value.activePatterns.filter(p => p.id !== id)
    });
  }

  // Enhanced Pattern Evolution with Entropy Protection
  evolvePattern(id: string): void {
    if (!this.state$.value.isProtected) {
      const patterns = this.state$.value.activePatterns;
      const patternIndex = patterns.findIndex(p => p.id === id);
      
      if (patternIndex >= 0) {
        const pattern = patterns[patternIndex];
        const entropyFactor = this.calculateEntropyFactor(pattern);
        const evolutionMetrics = this.calculateEvolutionMetrics(pattern);
        
        const evolved = {
          ...pattern,
          strength: Math.min(10, pattern.strength + (1 - entropyFactor) * evolutionMetrics.growthRate),
          evolution: {
            ...pattern.evolution,
            stage: Math.min(4, pattern.evolution.stage + (evolutionMetrics.readyToEvolve ? 1 : 0)),
            lastEvolved: new Date().toISOString(),
            entropyLevel: entropyFactor,
            metrics: evolutionMetrics
          }
        };

        patterns[patternIndex] = evolved;
        
        if (this.state$.value.currentSession) {
          this.updateCurrentSession({
            patterns: [...this.state$.value.currentSession.patterns, evolved.id]
          });
        }
        
        this.state$.next({
          ...this.state$.value,
          activePatterns: patterns
        });
      }
    }
  }

  private calculateEntropyFactor(pattern: Pattern): number {
    const now = new Date();
    const lastEvolved = new Date(pattern.evolution.lastEvolved);
    const hoursSinceEvolution = (now.getTime() - lastEvolved.getTime()) / (1000 * 60 * 60);
    
    const timeFactor = Math.min(1, hoursSinceEvolution / 24);
    const strengthFactor = 1 - (pattern.strength / 10);
    const stageFactor = pattern.evolution.stage / 4;
    
    return (timeFactor * 0.5 + strengthFactor * 0.3 + stageFactor * 0.2);
  }

  private calculateEvolutionMetrics(pattern: Pattern) {
    const recentSessions = this.state$.value.flowHistory
      .filter(session => {
        const sessionStart = new Date(session.startTime);
        const now = new Date();
        const hoursSince = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);
        return hoursSince <= 24 && session.patterns.includes(pattern.id);
      });

    const totalQuality = recentSessions.reduce((sum, s) => sum + s.metrics.quality, 0);
    const averageQuality = totalQuality / (recentSessions.length || 1);
    
    const totalIntensity = recentSessions.reduce((sum, s) => sum + s.metrics.intensity, 0);
    const averageIntensity = totalIntensity / (recentSessions.length || 1);
    
    const protectedSessions = recentSessions.filter(s => s.isProtected).length;
    const protectionRate = protectedSessions / (recentSessions.length || 1);
    
    const growthRate = (averageQuality * 0.4 + averageIntensity * 0.4 + protectionRate * 0.2);
    const readyToEvolve = growthRate >= 0.8 && pattern.evolution.entropyLevel < 0.3;
    
    return {
      usageCount: recentSessions.length,
      averageQuality,
      averageIntensity,
      protectionRate,
      growthRate,
      readyToEvolve
    };
  }

  // Pattern Strength Management
  strengthenPattern(id: string): void {
    const patterns = this.state$.value.activePatterns;
    const patternIndex = patterns.findIndex(p => p.id === id);
    
    if (patternIndex >= 0) {
      const pattern = patterns[patternIndex];
      const entropyFactor = this.calculateEntropyFactor(pattern);
      
      patterns[patternIndex] = {
        ...pattern,
        strength: Math.min(10, pattern.strength + (1 - entropyFactor) * 0.5)
      };
      
      this.state$.next({
        ...this.state$.value,
        activePatterns: patterns
      });
    }
  }

  // Flow State Analytics
  getFlowAnalytics(): Observable<{
    averageFlowDuration: number;
    peakFlowFrequency: number;
    entropyTrend: number;
    flowEfficiency: number;
    protectionRate: number;
    sessionMetrics: {
      totalSessions: number;
      averageQuality: number;
      averageIntensity: number;
      protectedSessions: number;
    };
  }> {
    return this.state$.pipe(
      map(state => {
        const patterns = state.activePatterns;
        const avgEntropy = patterns.reduce((sum, p) => 
          sum + this.calculateEntropyFactor(p), 0) / (patterns.length || 1);
        
        const avgDuration = this.calculateAverageFlowDuration();
        const peakFreq = this.calculatePeakFlowFrequency();
        
        const recentSessions = state.flowHistory.filter(session => {
          const sessionStart = new Date(session.startTime);
          const now = new Date();
          const hoursSince = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);
          return hoursSince <= 24;
        });

        const sessionMetrics = {
          totalSessions: recentSessions.length,
          averageQuality: recentSessions.reduce((sum, s) => sum + s.metrics.quality, 0) / (recentSessions.length || 1),
          averageIntensity: recentSessions.reduce((sum, s) => sum + s.metrics.intensity, 0) / (recentSessions.length || 1),
          protectedSessions: recentSessions.filter(s => s.isProtected).length
        };
        
        return {
          averageFlowDuration: avgDuration,
          peakFlowFrequency: peakFreq,
          entropyTrend: avgEntropy,
          flowEfficiency: avgDuration * (1 - avgEntropy),
          protectionRate: peakFreq / 24,
          sessionMetrics
        };
      })
    );
  }

  private calculateAverageFlowDuration(): number {
    const recentSessions = this.state$.value.flowHistory
      .filter(session => {
        const sessionStart = new Date(session.startTime);
        const now = new Date();
        const hoursSince = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);
        return hoursSince <= 24; // Only consider last 24 hours
      });

    if (recentSessions.length === 0) {
      return this.calculateCurrentSessionDuration();
    }

    const totalDuration = recentSessions.reduce((sum, session) => {
      return sum + session.metrics.duration;
    }, 0);

    return totalDuration / recentSessions.length;
  }

  private calculateCurrentSessionDuration(): number {
    if (!this.state$.value.currentSession) return 0;
    
    const startTime = new Date(this.state$.value.currentSession.startTime);
    const now = new Date();
    return (now.getTime() - startTime.getTime()) / (1000 * 60); // minutes
  }

  private calculatePeakFlowFrequency(): number {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const peakSessions = this.state$.value.flowHistory.filter(session => {
      const sessionStart = new Date(session.startTime);
      return sessionStart > oneDayAgo && 
             session.metrics.intensity >= 0.8 && 
             session.metrics.quality >= 0.7;
    });

    const currentIsPeak = this.state$.value.currentSession &&
                         this.calculateSessionMetrics(this.state$.value.currentSession).intensity >= 0.8;

    return peakSessions.length + (currentIsPeak ? 1 : 0);
  }

  // Pattern Persistence
  private persistPatterns(): void {
    const patterns = this.state$.value.activePatterns.map(pattern => ({
      ...pattern,
      timestamp: new Date().getTime()
    }));

    localStorage.setItem('aether_patterns', JSON.stringify(patterns));
  }

  private loadPersistedPatterns(): void {
    try {
      const stored = localStorage.getItem('aether_patterns');
      if (stored) {
        const patterns = JSON.parse(stored) as StoredPattern[];
        const now = new Date().getTime();
        
        // Only load patterns from the last 24 hours
        const recentPatterns = patterns.filter(p => 
          (now - p.timestamp) <= 24 * 60 * 60 * 1000
        );

        if (recentPatterns.length > 0) {
          this.state$.next({
            ...this.state$.value,
            activePatterns: recentPatterns.map(({ timestamp, ...pattern }) => pattern)
          });
        }
      }
    } catch (error) {
      console.error('Failed to load persisted patterns:', error);
    }
  }

  // Pattern Recovery
  private startPatternRecovery(): void {
    setInterval(() => {
      const patterns = this.state$.value.activePatterns;
      const recoveredPatterns = patterns.map(pattern => {
        const entropyFactor = this.calculateEntropyFactor(pattern);
        const evolutionMetrics = this.calculateEvolutionMetrics(pattern);
        
        // Natural recovery during rest state
        if (this.state$.value.flowState === 'rest' && entropyFactor > 0.3) {
          const recoveryRate = 0.1 * (1 - evolutionMetrics.averageIntensity);
          const newEntropyLevel = Math.max(0, pattern.evolution.entropyLevel - recoveryRate);
          
          return {
            ...pattern,
            evolution: {
              ...pattern.evolution,
              entropyLevel: newEntropyLevel,
              metrics: {
                ...evolutionMetrics,
                readyToEvolve: newEntropyLevel < 0.3 && evolutionMetrics.growthRate >= 0.8
              }
            }
          };
        }
        
        return pattern;
      });

      if (JSON.stringify(patterns) !== JSON.stringify(recoveredPatterns)) {
        this.state$.next({
          ...this.state$.value,
          activePatterns: recoveredPatterns
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  constructor() {
    this.loadPersistedPatterns();
    this.startPatternRecovery();

    // Persist patterns on changes
    this.state$.subscribe(() => {
      this.persistPatterns();
    });
  }
} 