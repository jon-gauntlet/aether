import { useState, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'

const RAG_ENDPOINT = process.env.REACT_APP_API_URL || 'http://localhost:8000'

// Mock responses for demo
const MOCK_RESPONSES = {
  default: "I'm an AI assistant trained to help with this project. What would you like to know?",
  help: "I can help you with various tasks like code explanations, debugging, and answering questions about the project.",
  features: "This project includes features like real-time chat, file sharing, and AI-powered responses using a RAG system.",
  rag: "The RAG (Retrieval Augmented Generation) system allows me to provide contextual responses based on project documentation and chat history."
}

export const useRAG = () => {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const query = useCallback(async (question) => {
    setIsLoading(true)
    try {
      // For demo, use mock responses
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
      
      const lowerQuestion = question.toLowerCase()
      let answer = MOCK_RESPONSES.default
      
      if (lowerQuestion.includes('help')) {
        answer = MOCK_RESPONSES.help
      } else if (lowerQuestion.includes('feature')) {
        answer = MOCK_RESPONSES.features
      } else if (lowerQuestion.includes('rag') || lowerQuestion.includes('ai')) {
        answer = MOCK_RESPONSES.rag
      }

      return { answer }
    } catch (err) {
      console.error('RAG query failed:', err)
      toast({
        title: 'AI Response Failed',
        description: err.message,
        status: 'error',
        duration: 3000,
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    query,
    isLoading
  }
} 