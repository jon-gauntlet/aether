import React, { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { ConsciousnessComponent } from './components/ConsciousnessComponent';
import { FieldComponent } from './components/FieldComponent';
import { PatternVisualization } from './components/PatternVisualization';
import { AutonomicDevelopment } from './components/AutonomicDevelopment';
import { Chat } from './components/Chat/Chat';
import { createDefaultField, createDefaultConsciousness, createDefaultPattern } from './core/types/system';
import { theme } from './styles/theme';
import { GlobalStyle } from './styles/global';
import { AuthProvider } from './core/auth/AuthProvider';
import { MessageProvider } from './core/messaging/MessageProvider';

const AppContainer = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: ${({ theme }) => theme.space.lg};
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const ChatWrapper = styled.div`
  grid-column: 1 / -1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`;

const App = () => {
  const [field] = useState(createDefaultField());
  const [consciousness] = useState(createDefaultConsciousness());
  const [pattern] = useState(createDefaultPattern());

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <MessageProvider>
          <AppContainer>
            <Grid>
              <ConsciousnessComponent consciousness={consciousness} />
              <FieldComponent field={field} />
              <PatternVisualization pattern={pattern} />
              <AutonomicDevelopment />
            </Grid>
            <ChatWrapper>
              <Chat />
            </ChatWrapper>
          </AppContainer>
        </MessageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 