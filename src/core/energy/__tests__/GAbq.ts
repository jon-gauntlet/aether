import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PredictiveValidation } from '../PredictiveValidation';
import { AutonomicSystem } from '../Autonomic';
import { EnergySystem } from '../../energy/EnergySystem';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

// Mock dependencies
vi.mock('../Autonomic');
vi.mock('../../energy/EnergySystem');

describe('PredictiveValidation', () => {
  let predictiveValidation: PredictiveValidation;
  let mockAutonomic: AutonomicSystem;
  let mockEnergy: EnergySystem;

  beforeEach(() => {
    mockAutonomic = {
      observeAutonomicState: vi.fn().mockReturnValue(new BehaviorSubject({
        confidence: 0.8,
        state: 'active'
      }))
    } as unknown as AutonomicSystem;

    mockEnergy = {
      observeEnergy: vi.fn().mockReturnValue(new BehaviorSubject({
        level: 0.7,
        type: 'flow'
      }))
    } as unknown as EnergySystem;

    predictiveValidation = new PredictiveValidation(mockAutonomic, mockEnergy);
  });

  it('should evolve autonomic behavior over time', async () => {
    const context = ['test-context'];
    const prediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    
    expect(prediction).toBeDefined();
    if (!prediction) throw new Error('Prediction should be defined');
    
    expect(prediction.context).toEqual(context);
    expect(prediction.predictions.success_probability).toBeGreaterThan(0);
  });

  it('should protect high-energy states', async () => {
    const context = ['flow', 'deep'];
    const prediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    
    expect(prediction).toBeDefined();
    if (!prediction) throw new Error('Prediction should be defined');
    
    const { timing } = prediction.predictions;
    expect(timing).toBeDefined();
    expect(typeof timing).toBe('number');
    // High energy states should have longer protection windows
    expect(timing).toBeGreaterThanOrEqual(1000);
    expect(timing).toBeLessThanOrEqual(5000);
  });

  it('should learn from validation patterns', async () => {
    const context = ['flow', 'learning'];
    const initialPrediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    if (!initialPrediction) throw new Error('Initial prediction should be defined');
    const initialProb = initialPrediction.predictions.success_probability;

    // Record successful validation with specific timing
    await predictiveValidation.recordValidation(context, true, { timing: 1500 });

    const updatedPrediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    if (!updatedPrediction) throw new Error('Updated prediction should be defined');
    expect(updatedPrediction.predictions.success_probability).toBeGreaterThan(initialProb);
    expect(updatedPrediction.predictions.optimal_timing).toBeDefined();
    expect(typeof updatedPrediction.predictions.optimal_timing).toBe('number');
    expect(updatedPrediction.predictions.optimal_timing).toBeCloseTo(1500, -2); // Within 100ms
  });

  it('should maintain system coherence', async () => {
    const contexts = ['test1', 'test2', 'test3'];
    const predictions = await Promise.all(
      contexts.map(ctx => 
        predictiveValidation.predictValidation([ctx]).pipe(take(1)).toPromise()
      )
    );

    predictions.forEach(pred => {
      if (!pred) throw new Error('Prediction should be defined');
      expect(pred.indicators).toBeDefined();
      expect(pred.predictions).toBeDefined();
      expect(typeof pred.predictions.success_probability).toBe('number');
    });
  });

  it('should adapt to changing contexts', async () => {
    const context = ['flow', 'adaptive'];
    const initialPrediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    if (!initialPrediction) throw new Error('Initial prediction should be defined');

    // Record validation with different timing
    await predictiveValidation.recordValidation(context, true, { timing: 2000 });

    const updatedPrediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    if (!updatedPrediction) throw new Error('Updated prediction should be defined');
    expect(updatedPrediction.predictions.optimal_timing).not.toBe(1000);
  });
}); 