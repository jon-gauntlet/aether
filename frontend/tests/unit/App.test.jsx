import React from 'react'
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../utils/test-utils'
import App from '../../src/App'

describe('App', () => {
  it('renders welcome message', async () => {
    await renderWithRouter(<App />)
    const heading = screen.getByRole('heading', { name: /Welcome to Aether/i })
    expect(heading).toBeInTheDocument()
  })

  it('has navigation links', async () => {
    await renderWithRouter(<App />)
    const homeLink = screen.getByRole('link', { name: /home/i })
    const aboutLink = screen.getByRole('link', { name: /about/i })
    expect(homeLink).toBeInTheDocument()
    expect(aboutLink).toBeInTheDocument()
  })
}) 