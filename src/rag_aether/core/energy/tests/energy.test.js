import { EnergySystem } from '../implementation';

describe('EnergySystem', () => {
  /** @type {import('../types').EnergyMetrics} */
  const initialMetrics = {
    strength: 0.5,
    resonance: 0.5,
    frequency: 1
  };

  /** @type {EnergySystem} */
  let system;

  beforeEach(() => {
    system = new EnergySystem(initialMetrics);
  });

  it('initializes with valid state', () => {
    expect(system.validateState()).toBe(true);
  });

  it('updates metrics correctly', () => {
    /** @type {import('../types').EnergyMetrics} */
    const newMetrics = {
      strength: 0.6,
      resonance: 0.6,
      frequency: 2
    };

    system.updateMetrics(newMetrics);
    const state = system.getCurrentState();

    expect(state.current).toEqual(newMetrics);
    expect(state.baseline).toEqual(initialMetrics);
    expect(state.peaks).toHaveLength(2);
    expect(state.peaks[1]).toEqual(newMetrics);
  });

  it('only adds peaks when metrics improve', () => {
    /** @type {import('../types').EnergyMetrics} */
    const lowerMetrics = {
      strength: 0.4,
      resonance: 0.4,
      frequency: 1
    };

    system.updateMetrics(lowerMetrics);
    const state = system.getCurrentState();

    expect(state.peaks).toHaveLength(1);
    expect(state.peaks[0]).toEqual(initialMetrics);
  });
}); 