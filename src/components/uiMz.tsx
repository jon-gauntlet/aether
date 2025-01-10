import React from 'react';
import { useFlowState } from '../../core/hooks/useFlowState';
import { usePatternContext } from '../../core/hooks/usePatternContext';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  flowAware?: boolean;
  patternGuided?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  flowAware = true,
  patternGuided = true,
  className = '',
}) => {
  const { currentFlow, flowLevel } = useFlowState();
  const { activePatterns } = usePatternContext();

  const cardClass = [
    'card',
    `card-${variant}`,
    flowAware && `flow-state-${currentFlow}`,
    flowAware && `flow-level-${flowLevel}`,
    patternGuided && activePatterns.length > 0 && 'pattern-guided',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      {children}
    </div>
  );
}; 