import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ErrorContainer = styled.div`
  padding: 20px;
  margin: 20px;
  border-radius: 8px;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  color: #cf1322;
`;

const ErrorHeading = styled.h2`
  margin: 0 0 10px 0;
  font-size: 1.2em;
`;

const ErrorMessage = styled.p`
  margin: 0 0 15px 0;
  font-family: monospace;
  white-space: pre-wrap;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
  background: transparent;
  color: #ff4d4f;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #ff4d4f;
    color: white;
  }
`;

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorHeading>Something went wrong</ErrorHeading>
          <ErrorMessage>
            {this.state.error?.message}
            {process.env.NODE_ENV === 'development' && this.state.error?.stack}
          </ErrorMessage>
          <RetryButton onClick={this.handleRetry}>
            Retry
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 