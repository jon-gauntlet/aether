import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 2rem;
  margin: 1rem;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 4px;
  color: white;
`;

const ErrorMessage = styled.pre`
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overflow: auto;
  max-height: 200px;
`;

const RetryButton = styled.button`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to your error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <h2>Something went wrong</h2>
          {this.state.error && (
            <ErrorMessage>
              {this.state.error.toString()}
            </ErrorMessage>
          )}
          {this.state.errorInfo && (
            <ErrorMessage>
              {this.state.errorInfo.componentStack}
            </ErrorMessage>
          )}
          <RetryButton onClick={this.handleRetry}>
            Try Again
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
} 