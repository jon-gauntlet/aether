/**
 * @typedef {Object} SpaceConfig
 * @property {string} id - Space identifier
 * @property {string} name - Space name
 * @property {number} capacity - Maximum capacity
 * @property {boolean} isPrivate - Privacy setting
 */

/**
 * @typedef {Object} SpaceState
 * @property {string} status - Current status
 * @property {number} usage - Current usage
 * @property {string[]} members - Member IDs
 */

/**
 * @typedef {Object} SpaceMetrics
 * @property {number} activeUsers - Number of active users
 * @property {number} messageCount - Total message count
 * @property {number} uptime - Space uptime in seconds
 */

// Space status constants
export const SPACE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  FULL: 'full',
  LOCKED: 'locked'
};

// Factory functions for creating objects
export const createSpace = (id, name) => ({
  id,
  name,
  capacity: 100,
  isPrivate: false
});

export const createSpaceState = () => ({
  status: SPACE_STATUS.INACTIVE,
  usage: 0,
  members: []
});

export const createSpaceMetrics = () => ({
  activeUsers: 0,
  messageCount: 0,
  uptime: 0
});

// Helper functions
export const isSpaceFull = (state) => state.usage >= state.capacity;
export const isSpaceActive = (state) => state.status === SPACE_STATUS.ACTIVE;