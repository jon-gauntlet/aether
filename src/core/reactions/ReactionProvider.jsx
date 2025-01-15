import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';

const ReactionContext = createContext();

// Emotion patterns configuration
const EMOTION_PATTERNS = {
  '❤️': { type: 'love', strength: 1.0, energy: 0.8, resonance: 0.9 },
  '👍': { type: 'approval', strength: 0.8, energy: 0.6, resonance: 0.7 },
  '🎉': { type: 'celebration', strength: 1.2, energy: 1.0, resonance: 1.0 },
  '🤔': { type: 'contemplation', strength: 0.6, energy: 0.4, resonance: 0.5 },
  '👏': { type: 'appreciation', strength: 0.9, energy: 0.7, resonance: 0.8 }
};

export const ReactionProvider = ({ children }) => {
  const [messageReactions, setMessageReactions] = useState({});
  const [emotionalPatterns, setEmotionalPatterns] = useState({});
  const { user } = useAuth();

  const addReaction = async (messageId, type) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'reactions'), {
        messageId,
        type,
        userId: user.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const removeReaction = async (reactionId) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'reactions', reactionId));
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  // Calculate emotional patterns based on reactions
  const calculatePatterns = (reactions) => {
    const patterns = {};
    Object.entries(reactions).forEach(([messageId, messageReactions]) => {
      const messagePatterns = [];
      const grouped = {};

      // Group reactions by type
      messageReactions.forEach(reaction => {
        const pattern = EMOTION_PATTERNS[reaction.type];
        if (!pattern) return;
        
        if (!grouped[pattern.type]) {
          grouped[pattern.type] = {
            type: pattern.type,
            strength: 0,
            count: 0,
            energy: pattern.energy,
            resonance: pattern.resonance,
            users: new Set(),
            sustained: false
          };
        }
        
        grouped[pattern.type].strength += pattern.strength;
        grouped[pattern.type].count++;
        grouped[pattern.type].users.add(reaction.userId);
        
        // Mark pattern as sustained if multiple users react the same way
        if (grouped[pattern.type].users.size >= 3) {
          grouped[pattern.type].sustained = true;
        }
      });

      // Convert grouped patterns to array and normalize strengths
      Object.values(grouped).forEach(pattern => {
        pattern.strength = pattern.strength / pattern.count;
        messagePatterns.push(pattern);
      });

      patterns[messageId] = messagePatterns;
    });
    return patterns;
  };

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'reactions'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reactionsByMessage = {};
      
      snapshot.forEach((doc) => {
        const reaction = { id: doc.id, ...doc.data() };
        const { messageId } = reaction;
        
        if (!reactionsByMessage[messageId]) {
          reactionsByMessage[messageId] = [];
        }
        
        reactionsByMessage[messageId].push(reaction);
      });
      
      setMessageReactions(reactionsByMessage);
      setEmotionalPatterns(calculatePatterns(reactionsByMessage));
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <ReactionContext.Provider 
      value={{ 
        messageReactions, 
        emotionalPatterns,
        EMOTION_PATTERNS,
        addReaction, 
        removeReaction 
      }}
    >
      {children}
    </ReactionContext.Provider>
  );
};

export const useReactions = () => {
  const context = useContext(ReactionContext);
  if (!context) {
    throw new Error('useReactions must be used within a ReactionProvider');
  }
  return context;
}; 