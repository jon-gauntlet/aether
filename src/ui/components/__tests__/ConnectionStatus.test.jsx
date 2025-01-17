import React from 'react'
import { render, screen } from '@testing-library/react'
import ConnectionStatus from '../ConnectionStatus'

describe('ConnectionStatus', () => {
  it('shows connected state', () => {
    render(<ConnectionStatus isConnected={true} />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('bg-green-50')
  })

  it('shows disconnected state', () => {
    render(<ConnectionStatus isConnected={false} />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('bg-red-50')
  })

  it('shows reconnecting state with attempts', () => {
    render(<ConnectionStatus isConnected={false} reconnectAttempts={2} />)
    expect(screen.getByText('Reconnecting (2)...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('bg-yellow-50')
  })

  it('applies custom className', () => {
    render(<ConnectionStatus isConnected={true} className="custom-class" />)
    expect(screen.getByRole('status')).toHaveClass('custom-class')
  })

  it('has correct ARIA attributes', () => {
    render(<ConnectionStatus isConnected={true} />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })
}) 