import React from 'react';
import styled from 'styled-components';
import { NaturalFlowType } from '../core/types/base';

const ModeContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
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
  const modes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];

  return (
    <ModeContainer>
      {modes.map(mode => (
        <ModeButton
          key={mode}
          $active={currentMode === mode}
          onClick={() => onModeChange(mode)}
        >
          {mode}
        </ModeButton>
      ))}
    </ModeContainer>
  );
};