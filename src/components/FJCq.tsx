import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import { useFlow } from '../../core/flow/useFlow';

interface PresenceProps {
  children: React.ReactNode;
}

const breathe = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Container = styled.div`
  position: relative;
  padding: 1rem;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

const PresenceIndicator = styled(motion.div)<{ $depth: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => `
    radial-gradient(
      circle at center,
      rgba(255, 255, 255, ${0.02 + props.$depth * 0.03}),
      transparent
    )
  `};
  pointer-events: none;
  animation: ${breathe} 4s ease-in-out infinite;
`;

const DeepIndicator = styled.div<{ active: boolean }>`
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

export const FlowPresence: React.FC<PresenceProps> = ({ children }) => {
  const { metrics, isDeep, isHarmonious } = useFlow();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    controls.start({
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        ease: 'easeInOut',
        repeat: Infinity
      }
    });
  }, [controls]);

  return (
    <Container ref={containerRef}>
      <PresenceIndicator
        $depth={metrics.depth}
        animate={controls}
      />
      
      <Content>
        {children}
      </Content>

      <DeepIndicator active={isDeep} />
    </Container>
  );
}; 