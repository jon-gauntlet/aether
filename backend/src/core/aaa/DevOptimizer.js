import { Observable, Subject } from 'rxjs';

/**
 * @typedef {Object} DevMetrics
 * @property {number} aiAssistanceLevel - 0-1 AI pair programming effectiveness
 * @property {number} modelCoherence - 0-1 AI model understanding
 * @property {number} promptQuality - 0-1 prompt engineering effectiveness
 * @property {number} selfOptimization - 0-1 system self-improvement
 * @property {number} adaptationRate - 0-1 speed of system adaptation
 * @property {number} learningEfficiency - 0-1 pattern learning effectiveness
 * @property {number} iterationSpeed - Iterations per hour
 * @property {number} feedbackLatency - Time between action and feedback
 * @property {number} deliverableProgress - 0-1 progress toward Week 1
 * @property {number} buildHealth - 0-1 build success rate
 * @property {number} testCoverage - 0-1 test coverage
 * @property {number} repoCoherence - 0-1 code organization quality
 * @property {number} flowInterruptions - Number of flow interruptions
 */

/**
 * @typedef {Object} DevAction
 * @property {string} type - Action type (START_FLOW, END_FLOW, COMMIT, AI_ASSIST, etc)
 * @property {number} timestamp - Action timestamp
 * @property {Object} [metadata] - Additional action metadata
 */

/**
 * Optimizes development process using AAA principles
 */
export class DevOptimizer {
  constructor() {
    /** @type {DevMetrics} */
    this.metrics = {
      // AI-First metrics
      aiAssistanceLevel: 0.8,
      modelCoherence: 0.7,
      promptQuality: 0.75,
      
      // Autonomic metrics
      selfOptimization: 0.6,
      adaptationRate: 0.65,
      learningEfficiency: 0.7,
      
      // Agile metrics
      iterationSpeed: 10,
      feedbackLatency: 300,
      deliverableProgress: 0.4,
      
      // Quality metrics
      buildHealth: 0.9,
      testCoverage: 0.8,
      repoCoherence: 0.75,
      
      // Flow metrics
      flowInterruptions: 0
    };

    /** @type {DevAction[]} */
    this.actions = [];
    this.metricsSubject = new Subject();
    this.sessionStartTime = Date.now();
    
    this.initializeAAACycle();
  }

  /**
   * @param {DevAction} action
   */
  recordAction(action) {
    this.actions.push(action);
    this.optimizeFromAction(action);
    this.metricsSubject.next(this.metrics);
  }

  /**
   * @returns {string[]}
   */
  getRecommendations() {
    const recentActions = this.getRecentActions(3600000); // Last hour
    const recommendations = [];

    if (recentActions.length > 0) {
      recommendations.push('Consider quick break to maintain energy');
    }

    return recommendations;
  }

  /**
   * @returns {Observable<DevMetrics>}
   */
  observeMetrics() {
    return this.metricsSubject.asObservable();
  }

  /**
   * @returns {DevMetrics}
   */
  getMetrics() {
    return this.metrics;
  }

  initializeAAACycle() {
    // Initialize optimization cycle
    setInterval(() => {
      this.updateMetrics(this.getRecentActions(900000)); // Last 15 min
      this.metricsSubject.next(this.metrics);
    }, 60000);
  }

  /**
   * @param {DevAction} action
   */
  optimizeFromAction(action) {
    switch (action.type) {
      case 'AI_ASSIST':
        this.metrics.aiAssistanceLevel = Math.min(1, this.metrics.aiAssistanceLevel + 0.1);
        break;
      case 'START_FLOW':
        // Track flow session start
        break;
      case 'END_FLOW':
        this.metrics.flowInterruptions++;
        break;
      case 'COMMIT':
        this.updateIterationSpeed();
        break;
      default:
        break;
    }
  }

  /**
   * @param {number} timeWindow
   * @returns {DevAction[]}
   */
  getRecentActions(timeWindow) {
    const now = Date.now();
    return this.actions.filter(a => now - a.timestamp < timeWindow);
  }

  updateIterationSpeed() {
    const commits = this.getRecentActions(3600000).filter(a => a.type === 'COMMIT');
    this.metrics.iterationSpeed = commits.length;
  }

  /**
   * @param {DevAction[]} recentActions
   */
  updateMetrics(recentActions) {
    // Update metrics based on recent actions
    this.metrics.adaptationRate = Math.min(1, this.metrics.adaptationRate + 0.05);
    this.metrics.learningEfficiency = Math.min(1, this.metrics.learningEfficiency + 0.05);
  }
} 