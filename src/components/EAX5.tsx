import React from 'react';
import styled from 'styled-components';

const HarmonyContainer = styled.div`
  padding: 20px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.01);
`;

export const FlowHarmony: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <HarmonyContainer>
    {children}
  </HarmonyContainer>
); 