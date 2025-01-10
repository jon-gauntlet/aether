import React from 'react';
import styled from 'styled-components';
import { PresenceType, FlowState } from '../core/experience/flow';

const Container = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px 12px 0 0;
  display: flex;
  gap: 20px;
  align-items: center;
`;

interface ControlButtonProps {
  active: boolean;
}

const ControlButton = styled.button<ControlButtonProps>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: #e6e6e6;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const FlowStateIndicator = styled.div`
  margin-left: auto;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.9em;
`;

interface PresenceControlsProps {
  presenceType: PresenceType;
  onPresenceTypeChange: (type: PresenceType) => void;
  flowState: FlowState;
}

const PresenceControls: React.FC<PresenceControlsProps> = ({
  presenceType,
  onPresenceTypeChange,
  flowState,
}) => {
  return (
    <Container>
      <ControlButton
        active={presenceType === 'reading'}
        onClick={() => onPresenceTypeChange('reading')}
      >
        Reading
      </ControlButton>
      <ControlButton
        active={presenceType === 'writing'}
        onClick={() => onPresenceTypeChange('writing')}
      >
        Writing
      </ControlButton>
      <ControlButton
        active={presenceType === 'thinking'}
        onClick={() => onPresenceTypeChange('thinking')}
      >
        Thinking
      </ControlButton>
      <ControlButton
        active={presenceType === 'listening'}
        onClick={() => onPresenceTypeChange('listening')}
      >
        Listening
      </ControlButton>
      <FlowStateIndicator>
        {flowState}
      </FlowStateIndicator>
    </Container>
  );
};

export default PresenceControls; 