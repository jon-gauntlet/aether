import { SpaceTypes, getDefaultSpaceType } from './SpaceTypes';

/**
 * @typedef {Object} SpaceConfig
 * @property {string} id - Unique identifier
 * @property {string} name - Space name
 * @property {Object} type - Space type configuration
 * @property {string} description - Space description
 * @property {Array<string>} members - Member IDs
 */

/**
 * Space represents a communication environment with specific characteristics
 */
export class Space {
  /**
   * Create a new Space
   * @param {SpaceConfig} config - Space configuration
   */
  constructor({
    id = crypto.randomUUID(),
    name = 'New Space',
    type = getDefaultSpaceType(),
    description = '',
    members = []
  } = {}) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.description = description;
    this.members = new Set(members);
    this.energyField = {
      level: 100,
      lastUpdate: Date.now()
    };
  }

  /**
   * Add a member to the space
   * @param {string} memberId - Member ID to add
   */
  addMember(memberId) {
    this.members.add(memberId);
  }

  /**
   * Remove a member from the space
   * @param {string} memberId - Member ID to remove
   */
  removeMember(memberId) {
    this.members.delete(memberId);
  }

  /**
   * Get space characteristics
   * @returns {Object} Space characteristics
   */
  getCharacteristics() {
    return {
      type: this.type,
      energyLevel: this.energyField.level
    };
  }

  /**
   * Update the space's energy field
   * @param {Object} updates - Energy field updates
   */
  updateEnergyField(updates) {
    this.energyField = {
      ...this.energyField,
      ...updates,
      lastUpdate: Date.now()
    };
  }

  /**
   * Check if a user is a member
   * @param {string} userId - User ID to check
   * @returns {boolean} True if user is a member
   */
  isMember(userId) {
    return this.members.has(userId);
  }

  /**
   * Convert space to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      members: Array.from(this.members),
      energyField: this.energyField
    };
  }

  /**
   * Create space from JSON
   * @param {Object} json - JSON representation
   * @returns {Space} New space instance
   */
  static fromJSON(json) {
    return new Space(json);
  }
} 