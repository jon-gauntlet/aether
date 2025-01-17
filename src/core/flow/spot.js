/**
 * Create a new spot in the flow
 * @param {Object} options - Spot options
 * @param {string} options.type - Type of spot
 * @param {Object} options.space - Space to create spot in
 * @returns {Object} The created spot
 */
export function spot({ type, space }) {
  return { type, space };
}

/**
 * Mix multiple spots together
 * @param {Array<Object>} spots - Spots to mix
 * @returns {Object} Mixed spot
 */
export function mix(spots) {
  return spots.reduce((mixed, spot) => ({
    ...mixed,
    ...spot
  }), {});
}

/**
 * Link spots together
 * @param {Object} source - Source spot
 * @param {Object} target - Target spot
 * @returns {boolean} Whether link was successful
 */
export function link(source, target) {
  return source && target;
}

/**
 * Check if space has room
 * @param {Object} space - Space to check
 * @returns {boolean} Whether space has room
 */
export function hasSpace(space) {
  return space && space.capacity > space.used;
}