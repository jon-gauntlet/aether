import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlow } from '../../core/flow/useFlow';
import { FlowType } from '../../core/flow/FlowEngine';

interface FlowSuggestion {
  type: FlowType;
  description: string;
  readiness: number;  // 0-1: how ready this path appears to be
}

export const FlowDiscovery: React.FC = () => {
  const { metrics, flows, enter, isHarmonious } = useFlow();
  const [suggestions, setSuggestions] = useState<FlowSuggestion[]>([]);
  
  // Discern natural paths of communication
  useEffect(() => {
    const discernPaths = () => {
      const newSuggestions: FlowSuggestion[] = [];

      // Text emerges when clarity is needed
      if (metrics.depth < 0.3) {
        newSuggestions.push({
          type: 'text',
          description: 'Share your thoughts clearly',
          readiness: 0.8
        });
      }

      // Voice emerges for deeper connection
      if (metrics.depth > 0.4 && metrics.harmony > 0.6) {
        newSuggestions.push({
          type: 'voice',
          description: 'Speak from the heart',
          readiness: 0.7
        });
      }

      // Visual emerges for shared understanding
      if (metrics.depth > 0.5 && flows.length > 0) {
        newSuggestions.push({
          type: 'visual',
          description: 'Share what you see',
          readiness: 0.6
        });
      }

      // Spatial emerges for holistic presence
      if (metrics.depth > 0.7 && isHarmonious) {
        newSuggestions.push({
          type: 'spatial',
          description: 'Be fully present',
          readiness: 0.9
        });
      }

      setSuggestions(newSuggestions);
    };

    discernPaths();
  }, [metrics, flows, isHarmonious]);

  // Let paths emerge naturally
  const handlePathSelection = async (suggestion: FlowSuggestion) => {
    if (suggestion.readiness > 0.5) {
      await enter(suggestion.type, {
        intention: 'connect',
        readiness: suggestion.readiness
      });
    }
  };

  return (
    <div className="flow-discovery">
      <AnimatePresence>
        {suggestions.map((suggestion) => (
          <motion.div
            key={suggestion.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className={`flow-suggestion ${suggestion.readiness > 0.7 ? 'ready' : ''}`}
            onClick={() => handlePathSelection(suggestion)}
          >
            <div className="suggestion-content">
              <div className="suggestion-type">{suggestion.type}</div>
              <div className="suggestion-description">{suggestion.description}</div>
              <div 
                className="suggestion-readiness"
                style={{ 
                  opacity: suggestion.readiness,
                  transform: `scale(${0.5 + suggestion.readiness * 0.5})`
                }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <style jsx>{`
        .flow-discovery {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .flow-suggestion {
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .flow-suggestion:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .flow-suggestion.ready {
          background: rgba(255, 255, 255, 0.15);
        }

        .suggestion-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .suggestion-type {
          font-weight: 500;
          text-transform: capitalize;
        }

        .suggestion-description {
          color: rgba(255, 255, 255, 0.7);
        }

        .suggestion-readiness {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}; 