/**
 * @typedef {Object} SpaceConfig
 * @property {string} id - Unique identifier
 * @property {string} name - Space name
 * @property {number} capacity - Maximum capacity
 * @property {boolean} isPrivate - Whether the space is private
 */

/**
 * @typedef {Object} SpaceState
 * @property {string} id - Space ID
 * @property {string} status - Current status
 * @property {number} usage - Current usage
 * @property {Object[]} members - Current members
 */

/**
 * @typedef {Object} SpaceMetrics
 * @property {number} activeUsers - Number of active users
 * @property {number} messageCount - Number of messages
 * @property {number} uptime - Space uptime in seconds
 */

/**
 * Core space management functions
 */

export const createSpace = (config) => ({
  id: config.id,
  name: config.name,
  capacity: config.capacity || 100,
  isPrivate: config.isPrivate || false,
  state: {
    status: 'active',
    usage: 0,
    members: []
  },
  metrics: {
    activeUsers: 0,
    messageCount: 0,
    uptime: 0
  }
});

export const updateSpaceState = (space, newState) => ({
  ...space,
  state: {
    ...space.state,
    ...newState
  }
});

export const updateSpaceMetrics = (space, newMetrics) => ({
  ...space,
  metrics: {
    ...space.metrics,
    ...newMetrics
  }
});