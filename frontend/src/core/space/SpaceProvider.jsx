import React, { createContext, useContext, useState, useEffect } from 'react';
import { Space } from './Space';
import { SpaceTypes } from './SpaceTypes';

const SpaceContext = createContext();

export const useSpaces = () => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpaces must be used within a SpaceProvider');
  }
  return context;
};

export const SpaceProvider = ({ children }) => {
  const [spaces, setSpaces] = useState([]);
  const [activeSpace, setActiveSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial spaces
  useEffect(() => {
    const loadSpaces = async () => {
      try {
        // TODO: Replace with actual API call
        const defaultSpaces = [
          new Space({
            id: 'commons-1',
            name: 'General',
            type: SpaceTypes.COMMONS,
            description: 'The main community space'
          }),
          new Space({
            id: 'sanctuary-1',
            name: 'Deep Focus',
            type: SpaceTypes.SANCTUARY,
            description: 'A space for focused work'
          }),
          new Space({
            id: 'workshop-1',
            name: 'Project Lab',
            type: SpaceTypes.WORKSHOP,
            description: 'Collaborative project workspace'
          })
        ];
        
        setSpaces(defaultSpaces);
        setActiveSpace(defaultSpaces[0]);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    loadSpaces();
  }, []);

  // Space management methods
  const createSpace = async (spaceData) => {
    try {
      const newSpace = new Space(spaceData);
      // TODO: API call to persist space
      setSpaces(prev => [...prev, newSpace]);
      return newSpace;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateSpace = async (spaceId, updates) => {
    try {
      setSpaces(prev => prev.map(space => {
        if (space.id === spaceId) {
          return new Space({ ...space, ...updates });
        }
        return space;
      }));
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const deleteSpace = async (spaceId) => {
    try {
      // TODO: API call to delete space
      setSpaces(prev => prev.filter(space => space.id !== spaceId));
      if (activeSpace?.id === spaceId) {
        setActiveSpace(spaces[0] || null);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const joinSpace = async (spaceId, userId) => {
    try {
      const space = spaces.find(s => s.id === spaceId);
      if (space) {
        space.addMember(userId);
        // TODO: API call to update membership
        setSpaces([...spaces]);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const leaveSpace = async (spaceId, userId) => {
    try {
      const space = spaces.find(s => s.id === spaceId);
      if (space) {
        space.removeMember(userId);
        // TODO: API call to update membership
        setSpaces([...spaces]);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const value = {
    spaces,
    activeSpace,
    loading,
    error,
    setActiveSpace,
    createSpace,
    updateSpace,
    deleteSpace,
    joinSpace,
    leaveSpace
  };

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
}; 