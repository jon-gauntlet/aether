import { ChakraProvider } from '@chakra-ui/react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Auth } from './components/Auth'
import ChatContainer from './components/ChatContainer'
import theme from './theme/theme.js'

function AppContent() {
  const { user } = useAuth()
  
  return user ? <ChatContainer /> : <Auth />
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ChakraProvider>
  )
}

export default App
