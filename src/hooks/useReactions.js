import { useState, useEffect } from 'react';

const useReactions = () => {
  const [reactions, setReactions] = useState([]);

  const addReaction = (reaction) => {
    setReactions(prev => [...prev, reaction]);
  };

  const removeReaction = (reactionId) => {
    setReactions(prev => prev.filter(r => r.id !== reactionId));
  };

  return {
    reactions,
    addReaction,
    removeReaction
  };
};

export default useReactions; 