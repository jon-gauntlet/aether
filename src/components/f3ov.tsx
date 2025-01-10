import React from 'react';
import styled from 'styled-components';
import { PresenceType, FlowState } from '../core/experience/flow';

interface PresenceControlsProps {
  presenceType: PresenceType;
  onPresenceTypeChange: (type: PresenceType) => void;
  flowState: FlowState;
}

const Container = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
`;

const PresenceButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const FlowStateIndicator = styled.div`
  padding: 8px 16px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
`;

const PresenceControls: React.FC<PresenceControlsProps> = ({
  presenceType,
  onPresenceTypeChange,
  flowState,
}) => {
  const presenceTypes: PresenceType[] = ['reading', 'writing', 'thinking', 'listening'];

  return (
    <Container>
      {presenceTypes.map(type => (
        <PresenceButton
          key={type}
          active={presenceType === type}
          onClick={() => onPresenceTypeChange(type)}
        >
          {type}
        </PresenceButton>
      ))}
      <FlowStateIndicator>
        <span>Flow: {flowState.coherence.toFixed(2)}</span>
      </FlowStateIndicator>
    </Container>
  );
};

export default PresenceControls;