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
    mockEnergy.observeEnergy = vi.fn().mockReturnValue(new BehaviorSubject({
      level: 0.9,
      type: 'flow'
    }));

    const timing = await predictiveValidation.getOptimalTiming(['flow-test']).pipe(take(1)).toPromise();
    expect(timing).toBeDefined();
    if (timing === undefined) throw new Error('Timing should be defined');
    expect(timing).toBeGreaterThan(1000);
  });

  it('should learn from validation patterns', async () => {
    const context = ['learning-test'];
    
    // Initial prediction
    const initialPrediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    if (!initialPrediction) throw new Error('Initial prediction should be defined');
    const initialProb = initialPrediction.predictions.success_probability;

    // Simulate successful validations
    mockAutonomic.observeAutonomicState = vi.fn().mockReturnValue(new BehaviorSubject({
      confidence: 0.9,
      state: 'active'
    }));

    // Get updated prediction
    const updatedPrediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    if (!updatedPrediction) throw new Error('Updated prediction should be defined');
    expect(updatedPrediction.predictions.success_probability).toBeGreaterThan(initialProb);
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
    const context = ['adaptive-test'];
    
    // Get initial prediction
    const initialPrediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    if (!initialPrediction) throw new Error('Initial prediction should be defined');
    
    // Change energy state
    mockEnergy.observeEnergy = vi.fn().mockReturnValue(new BehaviorSubject({
      level: 0.3,
      type: 'recovery'
    }));

    // Get updated prediction
    const updatedPrediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    if (!updatedPrediction) throw new Error('Updated prediction should be defined');
    expect(updatedPrediction.predictions.optimal_timing).not.toBe(initialPrediction.predictions.optimal_timing);
  });
}); 