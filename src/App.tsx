import React from 'react';
import { ThemeProvider } from 'styled-components';
import { defaultTheme } from './styles/defaultTheme';
import { GlobalStyle } from './styles/global';
import ChatWindow from './components/Chat/ChatWindow';

function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <GlobalStyle />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <ChatWindow />
      </div>
    </ThemeProvider>
  );
}

export default App; 