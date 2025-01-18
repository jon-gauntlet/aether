import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../src/contexts/AuthContext'

export function renderWithRouter(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route)
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  )
}

export * from '@testing-library/react' 