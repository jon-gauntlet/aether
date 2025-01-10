import React from 'react';
import styled from 'styled-components';

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: currentColor;
  opacity: 0.8;
`;

export const ThreadIcon: React.FC = () => (
  <IconWrapper>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  </IconWrapper>
);

export const MentionIcon: React.FC = () => (
  <IconWrapper>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
      <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    </svg>
  </IconWrapper>
);

export const DecisionIcon: React.FC = () => (
  <IconWrapper>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  </IconWrapper>
); 