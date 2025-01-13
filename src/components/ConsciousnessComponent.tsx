import React from 'react';
import styled from 'styled-components';
import { Theme } from '../styles/theme';

interface Props {
  theme: Theme;
}

const ;

const Header = styled.div<Props>`
  padding: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Title = styled.h2<Props>`
  margin: 0;
  color: ${({ theme }) => theme.colors.textAlt};
  font-size: ${({ theme }) => theme.space.lg};
`;

const ;

const Status = styled.div<Props & { status: 'success' | 'warning' | 'error' }>`
  padding: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
  background: ${({ theme, status }) => {
    switch (status) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.error;
    }
  }};
  color: ${({ theme }) => theme.colors.textAlt};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const ConsciousnessComponent: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>Natural Consciousness</Title>
      </Header>
      <Content>
        <Status status="success">
          System is naturally flowing
        </Status>
      </Content>
    </Container>
  );
}; 