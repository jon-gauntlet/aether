import React from 'react';
import { useFlowState } from '../../core/hooks/useFlowState';
import { usePatternContext } from '../../core/hooks/usePatternContext';
import './Container.css';

interface ContainerProps {
  children: React.ReactNode;
  flowAware?: boolean;
  patternGuided?: boolean;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  flowAware = true,
  patternGuided = true,
  className = '',
}) => {
  const { currentFlow, flowLevel } = useFlowState();
  const { activePatterns } = usePatternContext();

  const containerClass = [
    'container',
    flowAware && `flow-state-${currentFlow}`,
    flowAware && `flow-level-${flowLevel}`,
    patternGuided && activePatterns.length > 0 && 'pattern-guided',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      {children}
    </div>
  );
}; 