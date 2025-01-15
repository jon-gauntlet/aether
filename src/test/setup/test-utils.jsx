import React from 'react'
import { render as rtlRender, act } from '@testing-library/react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

// Keep track of active containers and roots
const activeContainers = new Set()
const activeRoots = new Map()

const customRender = async (ui, options = {}) => {
  // Cleanup any existing containers first
  for (const container of activeContainers) {
    if (document.body.contains(container)) {
      const root = activeRoots.get(container)
      if (root) {
        try {
          root.unmount()
        } catch (e) {
          // Ignore unmount errors
        }
      }
      document.body.removeChild(container)
      activeContainers.delete(container)
      activeRoots.delete(container)
    }
  }

  const container = document.createElement('div')
  document.body.appendChild(container)
  activeContainers.add(container)
  
  const { createRoot } = require('react-dom/client')
  const root = createRoot(container)
  activeRoots.set(container, root)
  
  let utils
  await act(async () => {
    root.render(<ErrorBoundary>{ui}</ErrorBoundary>)
    utils = rtlRender(ui, { 
      container, 
      wrapper: ErrorBoundary,
      ...options 
    })
  })
  
  const cleanup = async () => {
    if (activeRoots.has(container)) {
      const root = activeRoots.get(container)
      try {
        await act(async () => {
          root.unmount()
        })
      } catch (e) {
        // Ignore unmount errors
      }
      activeRoots.delete(container)
    }
    
    if (activeContainers.has(container) && document.body.contains(container)) {
      document.body.removeChild(container)
      activeContainers.delete(container)
    }
  }
  
  const rerender = async (newUi) => {
    if (activeRoots.has(container)) {
      await act(async () => {
        root.render(<ErrorBoundary>{newUi}</ErrorBoundary>)
      })
    }
    return utils
  }
  
  return {
    ...utils,
    rerender,
    unmount: cleanup,
    cleanup
  }
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render } 