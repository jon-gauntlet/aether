import React from 'react';
import { useFlowState } from '../../core/hooks/useFlowState';
import { usePatternContext } from '../../core/hooks/usePatternContext';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  flowAware?: boolean;
  patternGuided?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  flowAware = true,
  patternGuided = true,
  className = '',
  ...props
}) => {
  const { currentFlow, flowLevel } = useFlowState();
  const { activePatterns } = usePatternContext();

  const buttonClass = [
    'button',
    `button-${variant}`,
    `button-${size}`,
    flowAware && `flow-state-${currentFlow}`,
    flowAware && `flow-level-${flowLevel}`,
    patternGuided && activePatterns.length > 0 && 'pattern-guided',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
}; 