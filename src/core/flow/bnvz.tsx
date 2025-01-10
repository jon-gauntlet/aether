import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import { useFlow } from '../../core/flow/useFlow';

interface PresenceProps {
  children: React.ReactNode;
}

interface StyledPresenceProps {
  $isDeep: boolean;
  $isHarmonious: boolean;
}

const rippleAnimation = keyframes`
  to {
    transform: scale(100);
    opacity: 0;
  }
`;

const PresenceContainer = styled(motion.div)<StyledPresenceProps>`
  position: relative;
  padding: 2rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  overflow: hidden;
  transition: all 0.5s ease;

  ${(props: StyledPresenceProps) => props.$isDeep && `
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.03);
  `}

  ${(props: StyledPresenceProps) => props.$isHarmonious && `
    background: rgba(255, 255, 255, 0.07);
  `}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  ${(props: StyledPresenceProps) => props.$isDeep && `
    &::before {
      opacity: 1;
    }
  `}

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 100%
    );
    transform: scaleX(0);
    transition: transform 0.5s ease;
  }

  ${(props: StyledPresenceProps) => props.$isHarmonious && `
    &::after {
      transform: scaleX(1);
    }
  `}
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
`;

const Ripple = styled.div`
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0);
  animation: ${rippleAnimation} 1s ease-out;
`;

export const FlowPresence: React.FC<PresenceProps> = ({ children }) => {
  const { metrics, isDeep, isHarmonious } = useFlow();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Guide attention naturally
  useEffect(() => {
    const updatePresence = async () => {
      // Gentle breathing animation that deepens with presence
      await controls.start({
        scale: 1 + (metrics.depth * 0.02),
        transition: {
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse"
        }
      });
    };

    updatePresence();
  }, [controls, metrics.depth]);

  // Help maintain natural focus
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMovement = (e: MouseEvent) => {
      if (!isDeep) return;

      // Create gentle ripple effect
      const ripple = document.createElement('div') as HTMLDivElement;
      ripple.className = 'presence-ripple';
      ripple.style.left = `${e.clientX - container.offsetLeft}px`;
      ripple.style.top = `${e.clientY - container.offsetTop}px`;
      
      container.appendChild(ripple);
      
      // Let ripple naturally fade
      setTimeout(() => {
        ripple.remove();
      }, 1000);
    };

    container.addEventListener('mousemove', handleMovement);
    return () => container.removeEventListener('mousemove', handleMovement);
  }, [isDeep]);

  return (
    <PresenceContainer
      ref={containerRef}
      $isDeep={isDeep}
      $isHarmonious={isHarmonious}
      animate={controls}
    >
      <Content>
        {children}
      </Content>
    </PresenceContainer>
  );
}; 