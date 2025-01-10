import React from 'react';
import styled from 'styled-components';
import { NaturalFlowType } from '../core/types/base';

const Container = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Button = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

interface Props {
  currentMode: NaturalFlowType;
  onModeChange: (mode: NaturalFlowType) => void;
}

export const FlowModeSelector: React.FC<Props> = ({ currentMode, onModeChange }) => {
  return (
    <Container>
      <Button
        active={currentMode === 'natural'}
        onClick={() => onModeChange('natural')}
      >
        natural
      </Button>
      <Button
        active={currentMode === 'guided'}
        onClick={() => onModeChange('guided')}
      >
        guided
      </Button>
      <Button
        active={currentMode === 'resonant'}
        onClick={() => onModeChange('resonant')}
      >
        resonant
      </Button>
    </Container>
  );
}; 