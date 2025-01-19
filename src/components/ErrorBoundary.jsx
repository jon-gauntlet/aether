import React from 'react'
import { 
  Box, 
  VStack,
  Heading,
  Text, 
  Button,
  Code,
  Collapse,
  useDisclosure,
  Icon
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { WarningIcon, RepeatIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'

const MotionBox = motion(Box)

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      showDetails: false
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('Error caught by boundary:', error, errorInfo)
    
    // You could add error reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    })
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state
      
      return (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          p={8}
          maxW="600px"
          mx="auto"
          mt={8}
          bg="white"
          rounded="xl"
          shadow="xl"
          borderWidth="1px"
          borderColor="red.100"
        >
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <WarningIcon w={12} h={12} color="red.500" mb={4} />
              <Heading size="lg" color="red.500" mb={2}>
                Oops! Something went wrong
              </Heading>
              <Text color="gray.600">
                Don't worry, we've captured the error and our team has been notified.
              </Text>
            </Box>

            <VStack spacing={4}>
              <Button
                leftIcon={<RepeatIcon />}
                colorScheme="blue"
                size="lg"
                onClick={this.handleRetry}
                width="full"
              >
                Try Again
              </Button>
              
              <Button
                rightIcon={showDetails ? <ChevronUpIcon /> : <ChevronDownIcon />}
                variant="ghost"
                size="sm"
                onClick={this.toggleDetails}
              >
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
            </VStack>

            <Collapse in={showDetails}>
              <Box
                p={4}
                bg="gray.50"
                rounded="md"
                borderWidth="1px"
                borderColor="gray.200"
              >
                <Text fontWeight="bold" mb={2}>Error Message:</Text>
                <Code p={2} rounded="md" bg="red.50" color="red.800" width="full" mb={4}>
                  {error?.message || 'Unknown error'}
                </Code>

                {errorInfo && (
                  <>
                    <Text fontWeight="bold" mb={2}>Component Stack:</Text>
                    <Code p={2} rounded="md" bg="gray.100" display="block" whiteSpace="pre-wrap">
                      {errorInfo.componentStack}
                    </Code>
                  </>
                )}
              </Box>
            </Collapse>

            <Text fontSize="sm" color="gray.500" textAlign="center">
              If the problem persists, please contact support or try reloading the page.
            </Text>

            <Button
              variant="link"
              colorScheme="blue"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </VStack>
        </MotionBox>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 