import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutonomicDevelopment } from '../../hooks/useAutonomicDevelopment';
import { FlowStateGuardian } from '../../core/flow/FlowStateGuardian';
import { PatternCoherence } from '../../core/patterns/PatternCoherence';

const StyledContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--background);
  color: var(--text);
  transition: all 0.3s ease;

  &.flow-active {
    background: var(--background-focused);
  }

  &.pattern-resonance {
    border: 2px solid var(--accent);
  }
`;

const ContentArea = styled(motion.main)`
  flex: 1;
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  align-items: start;
`;

const FlowIndicator = styled(motion.div)<{ $protection: number }>`
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => `hsla(${props.$protection * 120}, 70%, 50%, ${0.3 + props.$protection * 0.7})`};
`;

const PatternVisualizer = styled(motion.div)<{ $resonance: number }>`
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  padding: 0.5rem;
  background: ${props => `hsla(${props.$resonance * 180}, 50%, 50%, 0.1)`};
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

export const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { flowState, patternMetrics, energyState } = useAutonomicDevelopment();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--background-focused',
      `hsl(220, ${Math.min(30 + flowState.depth * 20, 50)}%, ${Math.max(10, 20 - flowState.depth * 10)}%)`
    );
  }, [flowState.depth]);

  return (
    <StyledContainer
      className={`
        ${flowState.depth > 0.5 ? 'flow-active' : ''}
        ${patternMetrics.coherence > 0.7 ? 'pattern-resonance' : ''}
      `}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FlowIndicator
        $protection={flowState.protection.level}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
      />
      
      <ContentArea
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {children}
      </ContentArea>

      <PatternVisualizer
        $resonance={patternMetrics.resonance}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Pattern Coherence: {Math.round(patternMetrics.coherence * 100)}%
        <br />
        Energy Level: {Math.round(energyState.current * 100)}%
      </PatternVisualizer>
    </StyledContainer>
  );
}; 