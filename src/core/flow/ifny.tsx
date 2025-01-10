import React from 'react';
import { useFlowState } from '../../core/hooks/useFlowState';
import './Grid.css';

interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  flowAware?: boolean;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 12,
  gap = 16,
  flowAware = true,
  className = '',
}) => {
  const { currentFlow } = useFlowState();

  const gridClass = [
    'grid',
    flowAware && `flow-state-${currentFlow}`,
    className
  ].filter(Boolean).join(' ');

  const style = {
    '--grid-columns': columns,
    '--grid-gap': `${gap}px`,
  } as React.CSSProperties;

  return (
    <div className={gridClass} style={style}>
      {children}
    </div>
  );
}; 