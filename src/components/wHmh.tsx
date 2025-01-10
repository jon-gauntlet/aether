import React from 'react';
import styled from 'styled-components';

const DiscoveryContainer = styled.div`
  padding: 20px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.01);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FlowDiscovery: React.FC = () => (
  <DiscoveryContainer>
    <h3>Flow Space</h3>
  </DiscoveryContainer>
); 