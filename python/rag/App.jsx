import React from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import { GlobalStyle } from './styles/global';
import { BasicChat } from './components/Chat/BasicChat';
import { SpaceProvider } from './core/spaces/SpaceProvider';
import { MessageProvider } from './core/messaging/MessageProvider';
import { AuthProvider, useAuth } from './core/auth/AuthProvider';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return <BasicChat />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <SpaceProvider>
          <MessageProvider>
            <AppContent />
          </MessageProvider>
        </SpaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 