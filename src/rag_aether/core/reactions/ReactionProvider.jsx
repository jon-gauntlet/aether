import React, { createContext, useContext, useState } from 'react';

const ReactionContext = createContext({
  reactions: [],
  addReaction: () => {},
  removeReaction: () => {},
});

export const useReactions = () => {
  const context = useContext(ReactionContext);
  if (!context) {
    throw new Error('useReactions must be used within a ReactionProvider');
  }
  return context;
};

export const ReactionProvider = ({ children }) => {
  const [reactions, setReactions] = useState([]);

  const addReaction = (messageId, reaction) => {
    setReactions(prev => [...prev, { messageId, reaction, id: Date.now() }]);
  };

  const removeReaction = (reactionId) => {
    setReactions(prev => prev.filter(r => r.id !== reactionId));
  };

  return (
    <ReactionContext.Provider value={{ reactions, addReaction, removeReaction }}>
      {children}
    </ReactionContext.Provider>
  );
};

export default ReactionProvider; 