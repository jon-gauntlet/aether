import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PredictiveValidation } from '../PredictiveValidation';
import { AutonomicSystem } from '../Autonomic';
import { EnergySystem } from '../../energy/EnergySystem';
import { BehaviorSubject } from 'rxjs';

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
    expect(prediction.context).toEqual(context);
    expect(prediction.predictions.success_probability).toBeGreaterThan(0);
  });

  it('should protect high-energy states', async () => {
    mockEnergy.observeEnergy = vi.fn().mockReturnValue(new BehaviorSubject({
      level: 0.9,
      type: 'flow'
    }));

    const timing = await predictiveValidation.getOptimalTiming(['flow-test']).pipe(take(1)).toPromise();
    expect(timing).toBeGreaterThan(1000);
  });

  it('should learn from validation patterns', async () => {
    const context = ['learning-test'];
    
    // Initial prediction
    let prediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    const initialProb = prediction.predictions.success_probability;

    // Simulate successful validations
    mockAutonomic.observeAutonomicState = vi.fn().mockReturnValue(new BehaviorSubject({
      confidence: 0.9,
      state: 'active'
    }));

    // Get updated prediction
    prediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    expect(prediction.predictions.success_probability).toBeGreaterThan(initialProb);
  });

  it('should maintain system coherence', async () => {
    const contexts = ['test1', 'test2', 'test3'];
    const predictions = await Promise.all(
      contexts.map(ctx => 
        predictiveValidation.predictValidation([ctx]).pipe(take(1)).toPromise()
      )
    );

    predictions.forEach(pred => {
      expect(pred.indicators).toBeDefined();
      expect(pred.predictions).toBeDefined();
      expect(typeof pred.predictions.success_probability).toBe('number');
    });
  });

  it('should adapt to changing contexts', async () => {
    const context = ['adaptive-test'];
    
    // Get initial prediction
    let prediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    
    // Change energy state
    mockEnergy.observeEnergy = vi.fn().mockReturnValue(new BehaviorSubject({
      level: 0.3,
      type: 'recovery'
    }));

    // Get updated prediction
    const updatedPrediction = await predictiveValidation.predictValidation(context).pipe(take(1)).toPromise();
    expect(updatedPrediction.predictions.optimal_timing).not.toBe(prediction.predictions.optimal_timing);
  });
}); 