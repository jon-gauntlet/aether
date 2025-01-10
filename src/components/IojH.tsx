import React from 'react';
import styled from 'styled-components';

const PresenceContainer = styled.div`
  padding: 20px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
`;

export const FlowPresence: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PresenceContainer>
    {children}
  </PresenceContainer>
); 