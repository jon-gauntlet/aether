import React from 'react'
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../utils/test-utils'
import App from '../../src/App'

describe('App', () => {
  it('renders welcome message', async () => {
    await renderWithRouter(<App />)
    expect(await screen.findByText(/Welcome to Aether/i)).toBeInTheDocument()
  })

  it('has navigation links', async () => {
    await renderWithRouter(<App />)
    const homeLink = await screen.findByRole('link', { name: /home/i })
    const aboutLink = await screen.findByRole('link', { name: /about/i })
    expect(homeLink).toBeInTheDocument()
    expect(aboutLink).toBeInTheDocument()
  })
}) 