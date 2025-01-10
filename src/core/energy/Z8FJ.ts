import { PredictiveValidation } from '../PredictiveValidation';
import { AutonomicSystem } from '../Autonomic';
import { EnergySystem } from '../../energy/EnergySystem';
import { BehaviorSubject } from 'rxjs';

// Mock dependencies
jest.mock('../Autonomic');
jest.mock('../../energy/EnergySystem');

describe('PredictiveValidation', () => {
  let predictiveValidation: PredictiveValidation;
  let mockAutonomic: jest.Mocked<AutonomicSystem>;
  let mockEnergySystem: jest.Mocked<EnergySystem>;
  
  beforeEach(() => {
    // Setup mocks
    mockAutonomic = {
      observeAutonomicState: jest.fn().mockReturnValue(new BehaviorSubject({
        confidence: 0.8,
        context: ['test']
      }))
    } as any;

    mockEnergySystem = {
      observeEnergy: jest.fn().mockReturnValue(new BehaviorSubject({
        level: 0.9,
        type: 'flow'
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
        new BehaviorSubject({
          level: 0.9,
          type: 'flow'
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
      const energySubject = new BehaviorSubject({
        level: 0.9,
        type: 'flow'
      });

      mockEnergySystem.observeEnergy.mockReturnValue(energySubject);

      predictiveValidation
        .predictValidation(['decline-context'])
        .subscribe(() => {
          // Simulate energy decline
          energySubject.next({
            level: 0.7,
            type: 'flow'
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
        new BehaviorSubject({
          level: 1.0,
          type: 'flow'
        })
      );

      mockAutonomic.observeAutonomicState.mockReturnValue(
        new BehaviorSubject({
          confidence: 1.0,
          context: ['test']
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
}); // Merged from 1_Z8FJ.ts
import { PredictiveValidation } from '../PredictiveValidation';
import { AutonomicSystem } from '../Autonomic';
import { EnergySystem } from '../../energy/EnergySystem';
import { BehaviorSubject } from 'rxjs';

// Mock dependencies
jest.mock('../Autonomic');
jest.mock('../../energy/EnergySystem');

describe('PredictiveValidation', () => {
  let predictiveValidation: PredictiveValidation;
  let mockAutonomic: jest.Mocked<AutonomicSystem>;
  let mockEnergySystem: jest.Mocked<EnergySystem>;
  
  beforeEach(() => {
    // Setup mocks
    mockAutonomic = {
      observeAutonomicState: jest.fn().mockReturnValue(new BehaviorSubject({
        confidence: 0.8,
        context: ['test']
      }))
    } as any;

    mockEnergySystem = {
      observeEnergy: jest.fn().mockReturnValue(new BehaviorSubject({
        level: 0.9,
        type: 'flow'
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
        new BehaviorSubject({
          level: 0.9,
          type: 'flow'
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
      const energySubject = new BehaviorSubject({
        level: 0.9,
        type: 'flow'
      });

      mockEnergySystem.observeEnergy.mockReturnValue(energySubject);

      predictiveValidation
        .predictValidation(['decline-context'])
        .subscribe(() => {
          // Simulate energy decline
          energySubject.next({
            level: 0.7,
            type: 'flow'
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
        new BehaviorSubject({
          level: 1.0,
          type: 'flow'
        })
      );

      mockAutonomic.observeAutonomicState.mockReturnValue(
        new BehaviorSubject({
          confidence: 1.0,
          context: ['test']
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
}); // Merged from 1_Z8FJ.ts
import { PredictiveValidation } from '../PredictiveValidation';
import { AutonomicSystem } from '../Autonomic';
import { EnergySystem } from '../../energy/EnergySystem';
import { BehaviorSubject } from 'rxjs';

// Mock dependencies
jest.mock('../Autonomic');
jest.mock('../../energy/EnergySystem');

describe('PredictiveValidation', () => {
  let predictiveValidation: PredictiveValidation;
  let mockAutonomic: jest.Mocked<AutonomicSystem>;
  let mockEnergySystem: jest.Mocked<EnergySystem>;
  
  beforeEach(() => {
    // Setup mocks
    mockAutonomic = {
      observeAutonomicState: jest.fn().mockReturnValue(new BehaviorSubject({
        confidence: 0.8,
        context: ['test']
      }))
    } as any;

    mockEnergySystem = {
      observeEnergy: jest.fn().mockReturnValue(new BehaviorSubject({
        level: 0.9,
        type: 'flow'
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
        new BehaviorSubject({
          level: 0.9,
          type: 'flow'
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
      const energySubject = new BehaviorSubject({
        level: 0.9,
        type: 'flow'
      });

      mockEnergySystem.observeEnergy.mockReturnValue(energySubject);

      predictiveValidation
        .predictValidation(['decline-context'])
        .subscribe(() => {
          // Simulate energy decline
          energySubject.next({
            level: 0.7,
            type: 'flow'
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
        new BehaviorSubject({
          level: 1.0,
          type: 'flow'
        })
      );

      mockAutonomic.observeAutonomicState.mockReturnValue(
        new BehaviorSubject({
          confidence: 1.0,
          context: ['test']
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