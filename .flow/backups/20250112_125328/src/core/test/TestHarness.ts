import type { ValidationResult, TestEnhancedField, TestEnhancedMetrics } from '../types/base';

export interface TestResult extends ValidationResult {
  metrics?: {
    duration: number;
    performance: number;
  };
}

export class TestHarness {
  private field: TestEnhancedField;
  
  constructor() {
    this.field = this.createInitialField();
  }

  private createInitialField(): TestEnhancedField {
    return {
      resonance: {
        phase: 0,
        amplitude: 1,
        frequency: 1,
        coherence: 1,
        harmony: 1,
        stability: 1,
        harmonics: []
      },
      protection: {
        shields: 1,
        resilience: 1,
        adaptability: 1,
        stability: 1,
        integrity: 1,
        recovery: 1,
        strength: 1,
        level: 1,
        type: 'test'
      },
      flowMetrics: {
        conductivity: 1,
        velocity: 1,
        coherence: 1
      },
      metrics: {
        accuracy: 1,
        coverage: 1,
        performance: 1,
        velocity: 1,
        coherence: 1,
        conductivity: 1,
        energy: 1,
        flow: 1,
        focus: 1,
        intensity: 1,
        stability: 1,
        quality: 1
      },
      results: []
    };
  }

  async measure<T>(
    name: string,
    test: () => Promise<T> | T
  ): Promise<TestResult> {
    const startTime = performance.now();
    try {
      await test();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result: TestResult = {
        valid: true,
        errors: [],
        warnings: [],
        metrics: {
          duration,
          performance: this.field.metrics.performance
        }
      };

      this.field.results.push(result);
      this.adjustFieldMetrics(result);
      
      return result;
    } catch (error) {
      const result: TestResult = {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        metrics: {
          duration: performance.now() - startTime,
          performance: 0
        }
      };

      this.field.results.push(result);
      this.adjustFieldMetrics(result);
      
      return result;
    }
  }

  private adjustFieldMetrics(result: TestResult): void {
    const { metrics } = this.field;
    
    // Adjust accuracy based on test success
    metrics.accuracy = this.calculateMovingAverage(
      metrics.accuracy,
      result.valid ? 1 : 0
    );

    // Adjust coverage based on new test execution
    metrics.coverage = Math.min(1, metrics.coverage + 0.01);

    // Adjust performance based on execution time
    const performanceScore = result.metrics?.duration 
      ? Math.min(1, 1000 / result.metrics.duration)
      : 0;
    metrics.performance = this.calculateMovingAverage(
      metrics.performance,
      performanceScore
    );

    // Update flow metrics
    metrics.conductivity = (
      metrics.accuracy + 
      metrics.coverage + 
      metrics.performance
    ) / 3;

    metrics.velocity = performanceScore;
  }

  private calculateMovingAverage(current: number, newValue: number): number {
    const alpha = 0.1; // Smoothing factor
    return current * (1 - alpha) + newValue * alpha;
  }

  getMetrics(): TestEnhancedMetrics {
    return { ...this.field.metrics };
  }

  getResults(): ValidationResult[] {
    return [...this.field.results];
  }

  reset(): void {
    this.field = this.createInitialField();
  }
} 