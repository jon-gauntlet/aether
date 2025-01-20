import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  Text,
  Link
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const MotionBox = motion(Box);
const MotionContainer = motion(Container);

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const { login, signup, logout, user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: authError } = isSignup 
        ? await signup({ email, password })
        : await login({ email, password });
      
      if (authError) {
        setError(typeof authError === 'string' ? authError : authError.message);
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      setError(err.message || 'Error logging out');
    }
  };

  return (
    <Box p={4}>
      {error && (
        <Alert status="error" mb={4} data-testid="error-message">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {user ? (
        <VStack spacing={4}>
          <Text>Logged in as {user.email}</Text>
          <Button
            data-testid="logout-button"
            colorScheme="red"
            onClick={handleLogout}
            isLoading={isLoading}
            loadingText="Signing in..."
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            _active={{ transform: 'translateY(0)' }}
            transition="all 0.2s"
          >
            Logout
          </Button>
        </VStack>
      ) : (
        <form onSubmit={handleSubmit} noValidate data-testid="auth-form">
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
                disabled={isLoading}
                required
                aria-invalid={!email && 'true'}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
                disabled={isLoading}
                required
                aria-invalid={!password && 'true'}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              isLoading={isLoading}
              data-testid={isSignup ? "signup-button" : "login-button"}
              disabled={isLoading}
            >
              {isSignup ? 'Sign Up' : 'Login'}
            </Button>

            <Link
              onClick={() => setIsSignup(!isSignup)}
              color="blue.500"
              data-testid="signup-switch"
              _hover={{ textDecoration: 'underline' }}
            >
              {isSignup ? 'Already have an account? Login' : 'Need an account? Sign Up'}
            </Link>
          </VStack>
        </form>
      )}
    </Box>
  );
} 