import React from 'react';
import styled from 'styled-components';
import { PresenceType, FlowState } from '../core/experience/flow';

const Container = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
  align-items: center;
`;

const PresenceButton = styled.button<{ active: boolean; type: PresenceType }>`
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s ease;
  
  background: ${p => p.active ? ({
    reading: '#e3f2fd',
    writing: '#e8f5e9',
    thinking: '#f3e5f5',
    listening: '#fff3e0',
  }[p.type]) : '#f5f5f5'};
  
  color: ${p => p.active ? ({
    reading: '#1565c0',
    writing: '#2e7d32',
    thinking: '#7b1fa2',
    listening: '#ef6c00',
  }[p.type]) : '#616161'};
  
  &:hover {
    background: ${p => ({
      reading: '#e3f2fd',
      writing: '#e8f5e9',
      thinking: '#f3e5f5',
      listening: '#fff3e0',
    }[p.type])};
  }
`;

const FlowIndicator = styled.div<{ state: FlowState }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.9em;
  background: ${p => {
    switch (p.state) {
      case 'gathering': return '#fff8e1';
      case 'deepening': return '#fff3e0';
      case 'deep': return '#ffe0b2';
      case 'protected': return '#ffccbc';
      default: return '#f5f5f5';
    }
  }};
  color: ${p => {
    switch (p.state) {
      case 'gathering': return '#f57f17';
      case 'deepening': return '#ef6c00';
      case 'deep': return '#e65100';
      case 'protected': return '#bf360c';
      default: return '#616161';
    }
  }};
`;

interface PresenceControlsProps {
  currentType?: PresenceType;
  flowState: FlowState;
  onChangeType: (type: PresenceType) => void;
}

export const PresenceControls: React.FC<PresenceControlsProps> = ({
  currentType,
  flowState,
  onChangeType
}) => {
  const presenceTypes: PresenceType[] = ['reading', 'writing', 'thinking', 'listening'];
  
  return (
    <Container>
      {presenceTypes.map(type => (
        <PresenceButton
          key={type}
          type={type}
          active={currentType === type}
          onClick={() => onChangeType(type)}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </PresenceButton>
      ))}
      <FlowIndicator state={flowState}>
        {flowState.charAt(0).toUpperCase() + flowState.slice(1)}
      </FlowIndicator>
    </Container>
  );
}; 