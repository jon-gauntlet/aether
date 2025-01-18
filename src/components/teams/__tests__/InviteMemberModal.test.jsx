import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import InviteMemberModal from '../InviteMemberModal'

describe('InviteMemberModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()
  const mockTeamId = 1

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders modal with form elements', () => {
    render(
      <InviteMemberModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamId={mockTeamId}
      />
    )

    expect(screen.getByText('Invite Team Member')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Invite' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  test('handles email input changes', () => {
    render(
      <InviteMemberModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamId={mockTeamId}
      />
    )

    const emailInput = screen.getByLabelText('Email Address')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    expect(emailInput.value).toBe('test@example.com')
  })

  test('validates email format', async () => {
    render(
      <InviteMemberModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamId={mockTeamId}
      />
    )

    // Submit with invalid email
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'invalid-email' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

    // Should show validation stage but not proceed
    await waitFor(() => {
      expect(screen.getByText('Validating email...')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  test('shows progress stages during invitation process', async () => {
    render(
      <InviteMemberModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamId={mockTeamId}
      />
    )

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

    // Check progress stages
    await waitFor(() => {
      expect(screen.getByText('Validating email...')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Checking permissions...')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Creating invite...')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Sending invitation...')).toBeInTheDocument()
    })
  })

  test('disables form inputs during submission', async () => {
    render(
      <InviteMemberModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamId={mockTeamId}
      />
    )

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

    // Check that inputs are disabled
    await waitFor(() => {
      expect(screen.getByLabelText('Email Address')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      expect(screen.getByText('Sending...')).toBeInTheDocument()
    })
  })

  test('calls onSubmit with email and teamId', async () => {
    mockOnSubmit.mockResolvedValueOnce({})
    render(
      <InviteMemberModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamId={mockTeamId}
      />
    )

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        teamId: mockTeamId
      })
    })
  })

  test('calls onClose after successful submission', async () => {
    mockOnSubmit.mockResolvedValueOnce({})
    render(
      <InviteMemberModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamId={mockTeamId}
      />
    )

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  test('handles submission errors', async () => {
    const error = new Error('Failed to send invite')
    mockOnSubmit.mockRejectedValueOnce(error)
    
    render(
      <InviteMemberModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamId={mockTeamId}
      />
    )

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

    // Check that error is handled and form is re-enabled
    await waitFor(() => {
      expect(screen.getByLabelText('Email Address')).not.toBeDisabled()
      expect(screen.getByRole('button', { name: 'Send Invite' })).not.toBeDisabled()
    })

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  test('validates email before submission', async () => {
    const invalidEmails = ['', 'test', 'test@', 'test@example', '@example.com']
    
    render(
      <InviteMemberModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamId={mockTeamId}
      />
    )

    for (const email of invalidEmails) {
      // Fill and submit form
      fireEvent.change(screen.getByLabelText('Email Address'), {
        target: { value: email }
      })
      fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

      // Should not proceed past validation
      await waitFor(() => {
        expect(screen.getByText('Validating email...')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    }
  })
}) 