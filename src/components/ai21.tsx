import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlow } from '../../core/flow/useFlow';
import { FlowPresence } from './FlowPresence';

interface HarmonyProps {
  children: React.ReactNode;
}

const Container = styled.div`
  position: relative;
  padding: 1rem;
`;

const HarmonyLayer = styled(motion.div)<{ level: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => `
    radial-gradient(
      circle at center,
      rgba(255, 255, 255, ${0.02 + props.level * 0.02}),
      transparent
    )
  `};
  pointer-events: none;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

const HarmonyIndicator = styled.div<{ active: boolean }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)'};
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    border: 2px solid currentColor;
    opacity: ${props => props.active ? 0.5 : 0};
    transition: all 0.3s ease;
  }
`;

export const FlowHarmony: React.FC<HarmonyProps> = ({ children }) => {
  const { metrics, isHarmonious } = useFlow();
  const [activeHarmonies, setActiveHarmonies] = useState<Set<string>>(new Set());

  // Define the three levels of harmony
  useEffect(() => {
    const newHarmonies = new Set<string>();
    
    if (metrics.harmony > 0.3) newHarmonies.add('surface');
    if (metrics.harmony > 0.6) newHarmonies.add('resonant');
    if (metrics.harmony > 0.8) newHarmonies.add('profound');
    
    setActiveHarmonies(newHarmonies);
  }, [metrics.harmony]);

  return (
    <Container>
      <AnimatePresence>
        {Array.from(activeHarmonies).map((level, index) => (
          <HarmonyLayer
            key={level}
            level={index + 1}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </AnimatePresence>
      
      <Content>
        {children}
      </Content>

      <HarmonyIndicator active={isHarmonious} />
    </Container>
  );
}; 