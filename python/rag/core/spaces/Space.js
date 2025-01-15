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
class Space {
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
    this.members = members;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();

    // Initialize energy field based on space type
    this.energyField = {
      level: type.characteristics.energyLevel,
      resonance: 0,
      protection: type.characteristics.focusLevel === 'high'
    };
  }

  /**
   * Add a member to the space
   * @param {string} memberId - ID of member to add
   * @returns {boolean} Success status
   */
  addMember(memberId) {
    if (this.members.includes(memberId)) {
      return false;
    }
    this.members.push(memberId);
    this.updatedAt = Date.now();
    return true;
  }

  /**
   * Remove a member from the space
   * @param {string} memberId - ID of member to remove
   * @returns {boolean} Success status
   */
  removeMember(memberId) {
    const index = this.members.indexOf(memberId);
    if (index === -1) {
      return false;
    }
    this.members.splice(index, 1);
    this.updatedAt = Date.now();
    return true;
  }

  /**
   * Get space characteristics
   * @returns {Object} Space characteristics
   */
  getCharacteristics() {
    return this.type.characteristics;
  }

  /**
   * Update space energy field
   * @param {Object} updates - Energy field updates
   */
  updateEnergyField(updates) {
    this.energyField = {
      ...this.energyField,
      ...updates
    };
    this.updatedAt = Date.now();
  }

  /**
   * Check if user is member of space
   * @param {string} userId - User ID to check
   * @returns {boolean} Whether user is member
   */
  isMember(userId) {
    return this.members.includes(userId);
  }

  /**
   * Convert space to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type.type,
      description: this.description,
      members: this.members,
      energyField: this.energyField,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create space from JSON
   * @param {Object} json - JSON representation
   * @returns {Space} New space instance
   */
  static fromJSON(json) {
    return new Space({
      id: json.id,
      name: json.name,
      type: SpaceTypes[json.type],
      description: json.description,
      members: json.members
    });
  }
}

export default Space; 