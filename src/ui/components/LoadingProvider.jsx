import React, { createContext, useContext, useReducer, useCallback } from 'react'
import PropTypes from 'prop-types'

const LoadingContext = createContext(null)

const initialState = {
  loadingStates: {},
  errors: {},
}

function loadingReducer(state, action) {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.key]: true,
        },
        errors: {
          ...state.errors,
          [action.key]: null, // Clear any previous errors
        },
      }
    case 'STOP_LOADING':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.key]: false,
        },
      }
    case 'SET_ERROR':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.key]: false,
        },
        errors: {
          ...state.errors,
          [action.key]: action.error,
        },
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.key]: null,
        },
      }
    default:
      return state
  }
}

export function LoadingProvider({ children }) {
  const [state, dispatch] = useReducer(loadingReducer, initialState)

  const startLoading = useCallback((key) => {
    dispatch({ type: 'START_LOADING', key })
  }, [])

  const stopLoading = useCallback((key) => {
    dispatch({ type: 'STOP_LOADING', key })
  }, [])

  const setError = useCallback((key, error) => {
    dispatch({ type: 'SET_ERROR', key, error })
  }, [])

  const clearError = useCallback((key) => {
    dispatch({ type: 'CLEAR_ERROR', key })
  }, [])

  const withLoading = useCallback(async (key, asyncFn) => {
    try {
      startLoading(key)
      const result = await asyncFn()
      stopLoading(key)
      return result
    } catch (error) {
      setError(key, error.message)
      throw error
    }
  }, [startLoading, stopLoading, setError])

  return (
    <LoadingContext.Provider
      value={{
        isLoading: (key) => state.loadingStates[key] || false,
        getError: (key) => state.errors[key],
        startLoading,
        stopLoading,
        setError,
        clearError,
        withLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Example usage:
/*
function MyComponent() {
  const { isLoading, getError, withLoading } = useLoading()

  const handleSubmit = async () => {
    try {
      await withLoading('submit', async () => {
        // Async operation here
        await submitData()
      })
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  return (
    <div>
      <button 
        onClick={handleSubmit}
        disabled={isLoading('submit')}
      >
        {isLoading('submit') ? 'Submitting...' : 'Submit'}
      </button>
      {getError('submit') && (
        <div className="text-red-500">{getError('submit')}</div>
      )}
    </div>
  )
}
*/ 