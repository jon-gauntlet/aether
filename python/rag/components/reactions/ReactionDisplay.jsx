import React, { useMemo } from 'react';
import { useReactions } from '../../core/reactions/ReactionProvider';
import { useSpaces } from '../../core/spaces/SpaceProvider';
import './ReactionDisplay.css';

const ReactionDisplay = ({ messageId }) => {
  const { messageReactions, emotionalPatterns, EMOTION_PATTERNS, addReaction, removeReaction } = useReactions();
  const { currentSpace } = useSpaces();

  const reactions = messageReactions[messageId] || [];
  const patterns = emotionalPatterns[messageId] || [];

  // Calculate pattern strengths and organize by type
  const organizedPatterns = useMemo(() => {
    const grouped = {};
    reactions.forEach(reaction => {
      const pattern = EMOTION_PATTERNS[reaction.type];
      if (!pattern) return;
      
      if (!grouped[reaction.type]) {
        grouped[reaction.type] = {
          count: 0,
          energy: pattern.energy,
          resonance: pattern.resonance,
          users: new Set()
        };
      }
      grouped[reaction.type].count++;
      grouped[reaction.type].users.add(reaction.userId);
    });
    return grouped;
  }, [reactions, EMOTION_PATTERNS]);

  // Calculate energy influence from space
  const spaceEnergy = currentSpace?.energy?.intensity || 0.5;
  
  const handleReactionClick = async (type, existingReaction) => {
    if (existingReaction) {
      await removeReaction(messageId, existingReaction.timestamp.toMillis());
    } else {
      await addReaction(messageId, type);
    }
  };

  return (
    <div className="reaction-display">
      <div className="reaction-patterns">
        {patterns.map(pattern => (
          <div 
            key={pattern.type}
            className={`pattern-indicator ${pattern.sustained ? 'sustained' : ''} ${pattern.rhythm ? 'rhythmic' : ''}`}
            style={{
              '--pattern-strength': pattern.strength,
              '--pattern-resonance': pattern.resonance
            }}
          />
        ))}
      </div>
      
      <div className="reaction-grid">
        {Object.entries(EMOTION_PATTERNS).map(([emoji, pattern]) => {
          const stats = organizedPatterns[emoji];
          const strength = stats ? stats.count / reactions.length : 0;
          const energyLevel = stats ? stats.energy * spaceEnergy : pattern.energy * 0.5;
          
          return (
            <button
              key={emoji}
              className={`reaction-button ${stats ? 'active' : ''}`}
              onClick={() => handleReactionClick(emoji, reactions.find(r => r.type === emoji))}
              style={{
                '--energy-level': energyLevel,
                '--reaction-strength': strength
              }}
            >
              <span className="emoji">{emoji}</span>
              {stats && <span className="count">{stats.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReactionDisplay; 