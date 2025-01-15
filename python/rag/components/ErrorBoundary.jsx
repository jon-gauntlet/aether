import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const ErrorContainer = styled.div`
  padding: 20px;
  margin: 20px;
  border: 1px solid #ff0000;
  border-radius: 4px;
  background-color: #fff5f5;
  color: #ff0000;
`

const ErrorMessage = styled.div`
  margin-bottom: 10px;
  font-weight: bold;
`

const ErrorDetails = styled.pre`
  margin: 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  overflow: auto;
  font-size: 14px;
`

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorContainer>
          <ErrorMessage>Something went wrong</ErrorMessage>
          {process.env.NODE_ENV === 'development' && (
            <ErrorDetails>
              {this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </ErrorDetails>
          )}
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
}

export default ErrorBoundary 