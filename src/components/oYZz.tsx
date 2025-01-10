import React from 'react';
import styled from 'styled-components';
import { FlowState } from '../core/types/base';

const Container = styled.div`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: white;
`;

interface Props {
  state?: FlowState;
}

export const FlowStateIndicator: React.FC<Props> = ({ state }) => {
  if (!state) return null;

  return (
    <Container>
      <span>Flow: {state.metrics.coherence.toFixed(2)}</span>
    </Container>
  );
}; 