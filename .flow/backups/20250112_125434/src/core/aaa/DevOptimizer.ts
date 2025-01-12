import { Observable, Subject } from 'rxjs';
import { SystemHealthIntegrator } from '../system/SystemHealthIntegrator';
import { ProtectionSystem } from '../protection/ProtectionSystem';

export interface DevMetrics {
  // AI-First metrics
  aiAssistanceLevel: number;  // 0-1 AI pair programming effectiveness
  modelCoherence: number;     // 0-1 AI model understanding
  promptQuality: number;      // 0-1 prompt engineering effectiveness
  
  // Autonomic metrics
  selfOptimization: number;   // 0-1 system self-improvement
  adaptationRate: number;     // 0-1 speed of system adaptation
  learningEfficiency: number; // 0-1 pattern learning effectiveness
  
  // Agile metrics
  iterationSpeed: number;     // Iterations per hour
  feedbackLatency: number;    // Time between action and feedback
  deliverableProgress: number;// 0-1 progress toward Week 1
  
  // Quality metrics
  buildHealth: number;        // 0-1 build success rate
  testCoverage: number;       // 0-1 test coverage
  repoCoherence: number;      // 0-1 code organization quality
}

export interface DevAction {
  type: 'AI_ASSIST' | 'MODEL_SYNC' | 'PROMPT_GEN' | 
        'ADAPT' | 'LEARN' | 'OPTIMIZE' |
        'ITERATE' | 'FEEDBACK' | 'DELIVER' |
        'BUILD' | 'TEST' | 'DEPLOY';
  timestamp: number;
  metadata?: any;
}

/**
 * Optimizes development process using AAA principles:
 * - AI-First: Leverage AI for continuous improvement
 * - Autonomic: Self-managing and self-optimizing
 * - Agile: Rapid iteration with quality
 */
export class DevOptimizer {
  private metrics: DevMetrics = {
    // AI-First metrics
    aiAssistanceLevel: 0.8,
    modelCoherence: 0.7,
    promptQuality: 0.75,
    
    // Autonomic metrics
    selfOptimization: 0.6,
    adaptationRate: 0.7,
    learningEfficiency: 0.65,
    
    // Agile metrics
    iterationSpeed: 0,
    feedbackLatency: 0,
    deliverableProgress: 0,
    
    // Quality metrics
    buildHealth: 1,
    testCoverage: 1,
    repoCoherence: 1
  };

  private actions: DevAction[] = [];
  private metricsSubject = new Subject<DevMetrics>();
  private sessionStartTime: number;
  private healthIntegrator: SystemHealthIntegrator;

  constructor() {
    this.sessionStartTime = Date.now();
    const protectionSystem = new ProtectionSystem();
    this.healthIntegrator = new SystemHealthIntegrator(this, protectionSystem);
    
    // Start AAA optimization cycle
    this.initializeAAACycle();
  }

  /**
   * Records a development action and updates metrics
   */
  recordAction(action: DevAction) {
    this.actions.push(action);
    // Trigger autonomic optimization
    this.optimizeFromAction(action);
    this.metricsSubject.next(this.metrics);
  }

  /**
   * Gets current optimization recommendations based on AAA principles
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    // AI-First recommendations
    if (this.metrics.modelCoherence < 0.7) {
      recommendations.push('Improve AI model context and understanding');
    }
    if (this.metrics.promptQuality < 0.7) {
      recommendations.push('Enhance prompt engineering for better AI assistance');
    }

    // Autonomic recommendations
    if (this.metrics.selfOptimization < 0.6) {
      recommendations.push('Allow system to complete optimization cycle');
    }
    if (this.metrics.adaptationRate < 0.7) {
      recommendations.push('Reduce changes to allow adaptation');
    }

    // Agile recommendations
    if (this.metrics.iterationSpeed < 4) { // Less than 4 iterations/hour
      recommendations.push('Break work into smaller iterations');
    }
    if (this.metrics.feedbackLatency > 15 * 60 * 1000) { // >15 min
      recommendations.push('Tighten feedback loop');
    }

    return recommendations;
  }

  /**
   * Gets current development priorities based on AAA state
   */
  getPriorities(): string[] {
    const priorities: string[] = [];
    const timeToDeadline = this.getTimeToDeadline();

    // Critical deadline priorities
    if (timeToDeadline < 2 * 60 * 60 * 1000) { // <2 hours
      priorities.push('CRITICAL: Focus only on Week 1 requirements');
      priorities.push('Maximize AI assistance for critical path');
      priorities.push('Maintain rapid iteration cycle');
      return priorities;
    }

    // AI-First priorities
    if (this.metrics.aiAssistanceLevel < 0.7) {
      priorities.push('Improve AI collaboration patterns');
    }

    // Autonomic priorities
    if (this.metrics.learningEfficiency < 0.6) {
      priorities.push('Allow system to learn from patterns');
    }

    // Quality priorities
    if (this.metrics.testCoverage < 0.7) {
      priorities.push('Add core test coverage');
    }
    if (this.metrics.buildHealth < 0.9) {
      priorities.push('Fix build stability');
    }

    return priorities;
  }

  /**
   * Observes development metrics
   */
  observeMetrics(): Observable<DevMetrics> {
    return this.metricsSubject.asObservable();
  }

  private initializeAAACycle(): void {
    // Start autonomic optimization cycle
    setInterval(() => {
      this.metrics.selfOptimization = Math.min(1, this.metrics.selfOptimization + 0.1);
      this.metrics.adaptationRate = Math.min(1, this.metrics.adaptationRate + 0.05);
      this.metricsSubject.next(this.metrics);
    }, 5 * 60 * 1000); // Every 5 minutes

    // Monitor AI effectiveness
    setInterval(() => {
      const recentActions = this.getRecentActions(15 * 60 * 1000); // Last 15 min
      this.updateAIMetrics(recentActions);
    }, 60 * 1000); // Every minute
  }

  private optimizeFromAction(action: DevAction): void {
    switch (action.type) {
      case 'AI_ASSIST':
        this.metrics.aiAssistanceLevel = Math.min(1, this.metrics.aiAssistanceLevel + 0.1);
        break;
      case 'MODEL_SYNC':
        this.metrics.modelCoherence = Math.min(1, this.metrics.modelCoherence + 0.1);
        break;
      case 'PROMPT_GEN':
        this.metrics.promptQuality = Math.min(1, this.metrics.promptQuality + 0.1);
        break;
      case 'ADAPT':
        this.metrics.adaptationRate = Math.min(1, this.metrics.adaptationRate + 0.1);
        break;
      case 'LEARN':
        this.metrics.learningEfficiency = Math.min(1, this.metrics.learningEfficiency + 0.1);
        break;
      case 'ITERATE':
        this.updateIterationMetrics();
        break;
      case 'FEEDBACK':
        this.updateFeedbackMetrics(action.timestamp);
        break;
      case 'BUILD':
        this.updateBuildMetrics(action.metadata?.success);
        break;
      case 'TEST':
        this.updateTestMetrics(action.metadata?.coverage);
        break;
      case 'DEPLOY':
        this.metrics.deliverableProgress = Math.min(1, this.metrics.deliverableProgress + 0.1);
        break;
    }
  }

  private getRecentActions(timeWindow: number): DevAction[] {
    const now = Date.now();
    return this.actions.filter(a => now - a.timestamp < timeWindow);
  }

  private updateAIMetrics(recentActions: DevAction[]): void {
    const aiActions = recentActions.filter(a => 
      ['AI_ASSIST', 'MODEL_SYNC', 'PROMPT_GEN'].includes(a.type)
    );
    
    if (aiActions.length > 0) {
      const effectiveness = aiActions.reduce((sum, a) => 
        sum + (a.metadata?.effectiveness || 0.5), 0
      ) / aiActions.length;

      this.metrics.aiAssistanceLevel = 
        this.metrics.aiAssistanceLevel * 0.7 + effectiveness * 0.3;
    }
  }

  private updateIterationMetrics(): void {
    const recentIterations = this.getRecentActions(60 * 60 * 1000) // Last hour
      .filter(a => a.type === 'ITERATE');
    this.metrics.iterationSpeed = recentIterations.length;
  }

  private updateFeedbackMetrics(timestamp: number): void {
    const lastAction = this.actions[this.actions.length - 2];
    if (lastAction) {
      this.metrics.feedbackLatency = timestamp - lastAction.timestamp;
    }
  }

  private updateBuildMetrics(success?: boolean): void {
    if (success !== undefined) {
      const weight = 0.3; // Recent builds matter more
      this.metrics.buildHealth = 
        this.metrics.buildHealth * (1 - weight) +
        (success ? 1 : 0) * weight;
    }
  }

  private updateTestMetrics(coverage?: number): void {
    if (coverage !== undefined) {
      this.metrics.testCoverage = coverage;
    }
  }

  private getTimeToDeadline(): number {
    const deadline = new Date();
    deadline.setHours(15, 0, 0, 0); // 3 PM
    return Math.max(0, deadline.getTime() - Date.now());
  }
} 