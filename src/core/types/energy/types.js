/**
 * @typedef {Object} EnergyState
 * @property {number} level - Current energy level
 * @property {number} capacity - Maximum energy capacity
 * @property {string} type - Energy type
 */

/**
 * @typedef {Object} EnergyMetrics
 * @property {number} input - Energy input rate
 * @property {number} output - Energy output rate
 * @property {number} efficiency - Energy efficiency
 * @property {number} stability - Energy stability
 */

/**
 * @typedef {Object} EnergyPattern
 * @property {string} id - Pattern identifier
 * @property {string} type - Pattern type
 * @property {number} strength - Pattern strength
 */

// Energy types as constants
export const ENERGY_TYPES = {
  PHYSICAL: 'physical',
  MENTAL: 'mental',
  EMOTIONAL: 'emotional',
  SPIRITUAL: 'spiritual'
};

// Factory functions for creating objects
export const createEnergyState = (type = ENERGY_TYPES.PHYSICAL) => ({
  level: 100,
  capacity: 100,
  type
});

export const createEnergyMetrics = () => ({
  input: 0,
  output: 0,
  efficiency: 1,
  stability: 1
});

export const createEnergyPattern = (id, type) => ({
  id,
  type,
  strength: 1
});

// Helper functions
export const isEnergyDepleted = (state) => state.level <= 0;
export const hasEnergyCapacity = (state) => state.level < state.capacity; 