import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import theme from './theme'
import ErrorBoundary from './components/ErrorBoundary'
import { RAGProvider } from './contexts/RAGContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ChakraProvider theme={theme}>
          <RAGProvider>
            <App />
          </RAGProvider>
        </ChakraProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
) 