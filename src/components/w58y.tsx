import React, { useEffect, useState } from 'react';
import { NaturalFlow } from '../../core/experience/NaturalFlow';

interface FlowVisualProps {
  flow: NaturalFlow;
}

export const FlowVisual: React.FC<FlowVisualProps> = ({ flow }) => {
  const [depth, setDepth] = useState(0);
  const [energy, setEnergy] = useState(1);
  const [focus, setFocus] = useState(0);
  
  useEffect(() => {
    // Observe natural state changes
    const depthSub = flow.observeDepth().subscribe(setDepth);
    const energySub = flow.observeEnergy().subscribe(setEnergy);
    const focusSub = flow.observeFocus().subscribe(setFocus);
    
    return () => {
      depthSub.unsubscribe();
      energySub.unsubscribe();
      focusSub.unsubscribe();
    };
  }, [flow]);

  // Natural depth visualization
  const depthStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `rgba(0, 0, 0, ${depth * 0.5})`,
    transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // Energy flow visualization
  const energyStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: '100px',
    height: '100px',
    transform: `translate(-50%, -50%) scale(${0.5 + energy * 0.5})`,
    background: `radial-gradient(circle, 
      rgba(255,255,255,${energy}) 0%, 
      rgba(255,255,255,0) 70%
    )`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // Focus intensity visualization
  const focusStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: '200px',
    height: '200px',
    transform: 'translate(-50%, -50%)',
    border: `2px solid rgba(255,255,255,${focus * 0.8})`,
    borderRadius: '50%',
    boxShadow: `0 0 ${20 + focus * 30}px rgba(255,255,255,${focus * 0.3})`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={depthStyle} />
      <div style={energyStyle} />
      <div style={focusStyle} />
      
      {/* Natural state indicators */}
      <div style={{ 
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: `rgba(255,255,255,${0.3 + depth * 0.7})`,
        transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div>Depth: {(depth * 100).toFixed(0)}%</div>
        <div>Energy: {(energy * 100).toFixed(0)}%</div>
        <div>Focus: {(focus * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}; 