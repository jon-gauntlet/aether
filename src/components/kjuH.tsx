/* eslint-disable no-trailing-spaces */
import React from 'react';
import styled from 'styled-components';

const Indicator = styled.div`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

interface Props {
  flowValue: number;
}

export const FlowStateIndicator: React.FC<Props> = ({ flowValue }) => {
  return (
    <Indicator>
      Flow: {flowValue.toFixed(2)}
    </Indicator>
  );
};