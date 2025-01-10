import React from 'react';
import styled from 'styled-components';
import { PresenceType } from '../core/types/stream';
import { FlowStateIndicator } from './FlowStateIndicator';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

interface Props {
  currentType?: PresenceType;
  onTypeChange: (type: PresenceType) => void;
  flowState?: any;
}

export const PresenceControls: React.FC<Props> = ({
  currentType,
  onTypeChange,
  flowState
}) => {
  const presenceTypes: PresenceType[] = ['natural', 'guided', 'resonant'];

  return (
    <Container>
      <ButtonGroup>
        {presenceTypes.map(type => (
          <Button
            key={type}
            active={currentType === type}
            onClick={() => onTypeChange(type)}
          >
            {type}
          </Button>
        ))}
      </ButtonGroup>
      <FlowStateIndicator state={flowState} />
    </Container>
  );
};