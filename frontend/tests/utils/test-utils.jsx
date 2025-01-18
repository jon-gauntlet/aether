import React from 'react'
import { render } from '@testing-library/react'
import { act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../src/contexts/AuthContext'

export async function renderWithRouter(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route)
  let result
  await act(async () => {
    result = render(ui, { wrapper: BrowserRouter })
  })
  return result
}

export async function renderWithAuth(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route)
  let result
  await act(async () => {
    result = render(ui, {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
      )
    })
  })
  return result
}

export * from '@testing-library/react' 