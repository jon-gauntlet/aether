import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlow } from '../../core/flow/useFlow';
import { FlowType } from '../../core/flow/types';
import styled from 'styled-components';

interface FlowSuggestion {
  type: FlowType;
  description: string;
  readiness: number;
}

const Container = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Suggestion = styled(motion.div)<{ readiness: number }>`
  padding: 1rem;
  background: ${props => `rgba(255, 255, 255, ${0.05 + props.readiness * 0.1})`};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Description = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1em;
  margin-bottom: 0.5rem;
`;

const Readiness = styled.div<{ value: number }>`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9em;
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 0.5rem;
    background: ${props => 
      props.value > 0.8 ? '#4CAF50' :
      props.value > 0.6 ? '#FFC107' :
      '#FF5722'
    };
  }
`;

export const FlowDiscovery: React.FC = () => {
  const { metrics, flows, enter, isHarmonious } = useFlow();
  const [suggestions, setSuggestions] = useState<FlowSuggestion[]>([]);
  
  // Discern natural paths of communication
  useEffect(() => {
    const newSuggestions: FlowSuggestion[] = [];

    // Surface level text communication
    if (metrics.depth < 0.3) {
      newSuggestions.push({
        type: 'text',
        description: 'Share your thoughts clearly',
        readiness: 0.8
      });
    }

    // Voice communication when depth and harmony align
    if (metrics.depth > 0.4 && metrics.harmony > 0.6) {
      newSuggestions.push({
        type: 'voice',
        description: 'Speak from the heart',
        readiness: 0.7
      });
    }

    // Visual sharing in deeper states
    if (metrics.depth > 0.5 && flows.length > 0) {
      newSuggestions.push({
        type: 'visual',
        description: 'Share what you see',
        readiness: 0.6
      });
    }

    // Spatial presence in harmonious deep states
    if (metrics.depth > 0.7 && isHarmonious) {
      newSuggestions.push({
        type: 'spatial',
        description: 'Be fully present',
        readiness: 0.9
      });
    }

    setSuggestions(newSuggestions);
  }, [metrics, flows, isHarmonious]);

  return (
    <Container>
      <AnimatePresence>
        {suggestions.map(suggestion => (
          <Suggestion
            key={suggestion.type}
            readiness={suggestion.readiness}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => enter(suggestion.type)}
          >
            <Description>{suggestion.description}</Description>
            <Readiness value={suggestion.readiness}>
              {Math.round(suggestion.readiness * 100)}% ready
            </Readiness>
          </Suggestion>
        ))}
      </AnimatePresence>
    </Container>
  );
}; 