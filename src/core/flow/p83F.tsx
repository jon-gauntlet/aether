import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlow } from '../../core/flow/useFlow';
import { FlowPresence } from './FlowPresence';

interface HarmonyProps {
  children: React.ReactNode;
}

interface HarmonyLevel {
  name: string;
  description: string;
  readiness: number;
}

const HarmonyContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HarmonyLevel = styled(motion.div)<{ $active: boolean }>`
  padding: 1rem;
  border-radius: 8px;
  background: ${props => props.$active ? 
    'rgba(255, 255, 255, 0.1)' : 
    'rgba(255, 255, 255, 0.05)'
  };
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const LevelName = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;

const LevelDescription = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
`;

const HarmonyIndicator = styled(motion.div)`
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  margin: 0.5rem 0;
`;

export const FlowHarmony: React.FC<HarmonyProps> = ({ children }) => {
  const { metrics, isHarmonious } = useFlow();
  const [activeHarmonies, setActiveHarmonies] = useState<Set<string>>(new Set());

  // Define the three levels of harmony
  const harmonyLevels: HarmonyLevel[] = [
    {
      name: "Natural Harmony",
      description: "Flow with the natural rhythms of communication",
      readiness: metrics.depth
    },
    {
      name: "Human Harmony",
      description: "Connect with genuine human presence",
      readiness: metrics.harmony
    },
    {
      name: "Divine Harmony",
      description: "Align with higher purpose and truth",
      readiness: (metrics.depth + metrics.harmony) / 2
    }
  ];

  // Let harmonies emerge naturally
  useEffect(() => {
    const newHarmonies = new Set<string>();
    
    harmonyLevels.forEach(level => {
      if (level.readiness > 0.6) {
        newHarmonies.add(level.name);
      }
    });

    setActiveHarmonies(newHarmonies);
  }, [metrics]);

  return (
    <FlowPresence>
      <HarmonyContainer>
        <AnimatePresence>
          {harmonyLevels.map((level) => (
            <HarmonyLevel
              key={level.name}
              $active={activeHarmonies.has(level.name)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <LevelName>{level.name}</LevelName>
              <LevelDescription>{level.description}</LevelDescription>
              
              <HarmonyIndicator
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: level.readiness,
                  opacity: level.readiness 
                }}
                transition={{ duration: 0.5 }}
              />
            </HarmonyLevel>
          ))}
        </AnimatePresence>

        {isHarmonious && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        )}
      </HarmonyContainer>
    </FlowPresence>
  );
}; 