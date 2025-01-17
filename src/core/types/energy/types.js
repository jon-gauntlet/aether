/**
 * @typedef {Object} EnergyState
 * @property {number} level - Current energy level
 * @property {number} capacity - Maximum energy capacity
 * @property {number} flow - Energy flow rate
 * @property {string} type - Energy type
 */

/**
 * @typedef {Object} EnergyMetrics
 * @property {number} input - Energy input rate
 * @property {number} output - Energy output rate
 * @property {number} efficiency - Energy efficiency (0-1)
 * @property {number} stability - Energy stability (0-1)
 */

/**
 * @typedef {Object} EnergyPattern
 * @property {string} id - Pattern ID
 * @property {string} type - Pattern type
 * @property {number} strength - Pattern strength (0-1)
 * @property {Object} metadata - Additional pattern metadata
 */

/**
 * Energy types enum as constants
 */
export const EnergyTypes = {
  PHYSICAL: 'physical',
  MENTAL: 'mental',
  EMOTIONAL: 'emotional',
  SPIRITUAL: 'spiritual'
};

/**
 * Core energy management functions
 */

export const createEnergyState = (type = EnergyTypes.PHYSICAL) => ({
  level: 100,
  capacity: 100,
  flow: 0,
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
  strength: 0,
  metadata: {}
});

export const isEnergyDepleted = (state) => state.level <= 0;

export const hasEnergyCapacity = (state) => state.level < state.capacity; 