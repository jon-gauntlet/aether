import React, { useState } from 'react';
import { useSpaces } from '../../core/spaces/SpaceProvider';
import { SpaceTypes } from '../../core/spaces/SpaceTypes';

export const SpaceList = () => {
  const {
    spaces,
    activeSpace,
    setActiveSpace,
    createSpace,
    loading,
    error
  } = useSpaces();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState(SpaceTypes.COMMONS.type);
  const [newSpaceDescription, setNewSpaceDescription] = useState('');

  if (loading) return <div>Loading spaces...</div>;
  if (error) return <div>Error loading spaces: {error.message}</div>;

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    try {
      await createSpace({
        name: newSpaceName,
        type: SpaceTypes[newSpaceType],
        description: newSpaceDescription
      });
      setShowCreateModal(false);
      setNewSpaceName('');
      setNewSpaceType(SpaceTypes.COMMONS.type);
      setNewSpaceDescription('');
    } catch (err) {
      console.error('Failed to create space:', err);
    }
  };

  const renderSpaceIcon = (type) => {
    // TODO: Replace with actual icons
    switch (type) {
      case 'SANCTUARY': return '🧘';
      case 'WORKSHOP': return '🛠️';
      case 'GARDEN': return '🌱';
      case 'COMMONS': return '👥';
      case 'LIBRARY': return '📚';
      case 'RECOVERY': return '🌿';
      default: return '📝';
    }
  };

  return (
    <div className="space-list">
      <div className="space-list-header">
        <h2>Spaces</h2>
        <button onClick={() => setShowCreateModal(true)}>
          Create Space
        </button>
      </div>

      <div className="space-groups">
        {Object.entries(SpaceTypes).map(([type, spaceType]) => {
          const typeSpaces = spaces.filter(space => space.type.type === type);
          if (typeSpaces.length === 0) return null;

          return (
            <div key={type} className="space-group">
              <h3>{type}</h3>
              {typeSpaces.map(space => (
                <div
                  key={space.id}
                  className={`space-item ${activeSpace?.id === space.id ? 'active' : ''}`}
                  onClick={() => setActiveSpace(space)}
                >
                  <span className="space-icon">
                    {renderSpaceIcon(space.type.type)}
                  </span>
                  <span className="space-name">{space.name}</span>
                  {space.isProtected() && (
                    <span className="space-protection">🛡️</span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New Space</h3>
            <form onSubmit={handleCreateSpace}>
              <div>
                <label>Name:</label>
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Type:</label>
                <select
                  value={newSpaceType}
                  onChange={(e) => setNewSpaceType(e.target.value)}
                >
                  {Object.entries(SpaceTypes).map(([type, spaceType]) => (
                    <option key={type} value={type}>
                      {spaceType.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Description:</label>
                <textarea
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 