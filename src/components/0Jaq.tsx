import React from 'react';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--background);
  color: var(--text);
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid var(--primary-light);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingMessage = styled.p`
  font-size: 1.2rem;
  opacity: 0.8;
  text-align: center;
  max-width: 80%;
  margin: 0 auto;
`;

interface Props {
  message?: string;
}

export const LoadingScreen: React.FC<Props> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <LoadingContainer>
      <LoadingSpinner />
      <LoadingMessage>{message}</LoadingMessage>
    </LoadingContainer>
  );
}; 