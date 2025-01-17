import { Box } from '@chakra-ui/react';
import { ChatContainer } from './components/ChatContainer';

function App() {
  return (
    <Box
      minH="100vh"
      bg="gray.900"
      backgroundImage="radial-gradient(circle at 50% 50%, rgba(50, 50, 50, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      position="relative"
      sx={{
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h20v20H0z" fill="%23ffffff" fill-opacity="0.05"/%3E%3C/svg%3E")',
          opacity: 0.5,
          pointerEvents: 'none',
        }
      }}
    >
      <ChatContainer />
    </Box>
  );
}

export default App;
