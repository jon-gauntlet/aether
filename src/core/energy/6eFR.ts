import { PredictiveValidation } from '../PredictiveValidation';
import { AutonomicSystem } from '../Autonomic';
import { EnergySystem, EnergyState } from '../../energy/EnergySystem';
import { BehaviorSubject } from 'rxjs';

// Mock dependencies
jest.mock('../Autonomic');
jest.mock('../../energy/EnergySystem');

// Mock types
interface AutonomicState {
  confidence: number;
  context: string[];
  proactivity: number;
  context_depth: number;
  energy_alignment: number;
}

describe('PredictiveValidation', () => {
  let predictiveValidation: PredictiveValidation;
  let mockAutonomic: jest.Mocked<AutonomicSystem>;
  let mockEnergySystem: jest.Mocked<EnergySystem>;
  
  beforeEach(() => {
    // Setup mocks
    mockAutonomic = {
      observeAutonomicState: jest.fn().mockReturnValue(new BehaviorSubject<AutonomicState>({
        confidence: 0.8,
        context: ['test'],
        proactivity: 0.7,
        context_depth: 0.6,
        energy_alignment: 0.9
      }))
    } as any;

    mockEnergySystem = {
      observeEnergy: jest.fn().mockReturnValue(new BehaviorSubject<EnergyState>({
        level: 0.9,
        type: 'flow',
        context: ['test'],
        protection: 0.8,
        resonance: 0.7
      }))
    } as any;

    predictiveValidation = new PredictiveValidation(
      mockAutonomic,
      mockEnergySystem
    );
  });

  describe('predictValidation', () => {
    it('should create new pattern for unknown context', done => {
      predictiveValidation
        .predictValidation(['new-context'])
        .subscribe(pattern => {
          expect(pattern.context).toEqual(['new-context']);
          expect(pattern.indicators.energy_trend).toEqual([0.5]);
          expect(pattern.predictions.success_probability).toBe(0.5);
          done();
        });
    });

    it('should update existing pattern with new energy level', done => {
      // First create pattern
      predictiveValidation
        .predictValidation(['test-context'])
        .subscribe(() => {
          // Then check update
          predictiveValidation
            .predictValidation(['test-context'])
            .subscribe(pattern => {
              expect(pattern.indicators.energy_trend).toContain(0.9);
              done();
            });
        });
    });
  });

  describe('getOptimalTiming', () => {
    it('should return default timing for new context', done => {
      predictiveValidation
        .getOptimalTiming(['new-context'])
        .subscribe(timing => {
          expect(timing).toBe(1000);
          done();
        });
    });

    it('should adjust timing based on energy level', done => {
      // Setup high energy flow state
      mockEnergySystem.observeEnergy.mockReturnValue(
        new BehaviorSubject<EnergyState>({
          level: 0.9,
          type: 'flow',
          context: ['test'],
          protection: 0.8,
          resonance: 0.7
        })
      );

      predictiveValidation
        .predictValidation(['flow-context'])
        .subscribe(() => {
          predictiveValidation
            .getOptimalTiming(['flow-context'])
            .subscribe(timing => {
              expect(timing).toBeGreaterThan(1000);
              done();
            });
        });
    });
  });

  describe('getPredictedIssues', () => {
    it('should detect energy decline', done => {
      // Setup declining energy trend
      const energySubject = new BehaviorSubject<EnergyState>({
        level: 0.9,
        type: 'flow',
        context: ['test'],
        protection: 0.8,
        resonance: 0.7
      });

      mockEnergySystem.observeEnergy.mockReturnValue(energySubject);

      predictiveValidation
        .predictValidation(['decline-context'])
        .subscribe(() => {
          // Simulate energy decline
          energySubject.next({
            level: 0.7,
            type: 'flow',
            context: ['test'],
            protection: 0.8,
            resonance: 0.7
          });

          predictiveValidation
            .getPredictedIssues(['decline-context'])
            .subscribe(issues => {
              expect(issues).toContain('energy_declining');
              done();
            });
        });
    });
  });

  describe('getSuccessProbability', () => {
    it('should combine energy and confidence factors', done => {
      // Setup high energy and confidence
      mockEnergySystem.observeEnergy.mockReturnValue(
        new BehaviorSubject<EnergyState>({
          level: 1.0,
          type: 'flow',
          context: ['test'],
          protection: 1.0,
          resonance: 1.0
        })
      );

      mockAutonomic.observeAutonomicState.mockReturnValue(
        new BehaviorSubject<AutonomicState>({
          confidence: 1.0,
          context: ['test'],
          proactivity: 1.0,
          context_depth: 1.0,
          energy_alignment: 1.0
        })
      );

      predictiveValidation
        .getSuccessProbability(['optimal-context'])
        .subscribe(probability => {
          expect(probability).toBeGreaterThan(0.8);
          done();
        });
    });
  });
}); 