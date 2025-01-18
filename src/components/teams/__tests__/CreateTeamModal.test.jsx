import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import CreateTeamModal from '../CreateTeamModal'

describe('CreateTeamModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders modal with form elements', () => {
    render(<CreateTeamModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)

    expect(screen.getByText('Create Team')).toBeInTheDocument()
    expect(screen.getByLabelText('Team Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Team' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  test('handles form input changes', () => {
    render(<CreateTeamModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)

    const nameInput = screen.getByLabelText('Team Name')
    const descInput = screen.getByLabelText('Description')

    fireEvent.change(nameInput, { target: { value: 'New Team' } })
    fireEvent.change(descInput, { target: { value: 'Team Description' } })

    expect(nameInput.value).toBe('New Team')
    expect(descInput.value).toBe('Team Description')
  })

  test('validates required team name', async () => {
    render(<CreateTeamModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)

    // Submit without name
    fireEvent.click(screen.getByRole('button', { name: 'Create Team' }))

    // Should show validation stage but not proceed
    await waitFor(() => {
      expect(screen.getByText('Validating')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  test('shows progress stages during team creation', async () => {
    render(<CreateTeamModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)

    // Fill form
    fireEvent.change(screen.getByLabelText('Team Name'), {
      target: { value: 'New Team' }
    })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Team' }))

    // Check progress stages
    await waitFor(() => {
      expect(screen.getByText('Validating')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Creating Team')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Setting Up')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })

  test('disables form inputs during submission', async () => {
    render(<CreateTeamModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Team Name'), {
      target: { value: 'New Team' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Team' }))

    // Check that inputs are disabled
    await waitFor(() => {
      expect(screen.getByLabelText('Team Name')).toBeDisabled()
      expect(screen.getByLabelText('Description')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      expect(screen.getByText('Creating...')).toBeInTheDocument()
    })
  })

  test('shows progress bar with correct percentage', async () => {
    render(<CreateTeamModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Team Name'), {
      target: { value: 'New Team' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Team' }))

    // Check progress bar
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveStyle({ width: '25%' })
    })

    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveStyle({ width: '50%' })
    })
  })

  test('calls onSubmit with form data', async () => {
    mockOnSubmit.mockResolvedValueOnce({})
    render(<CreateTeamModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)

    // Fill form
    fireEvent.change(screen.getByLabelText('Team Name'), {
      target: { value: 'New Team' }
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Team Description' }
    })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Team' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Team',
        description: 'Team Description'
      })
    })
  })

  test('calls onClose after successful submission', async () => {
    mockOnSubmit.mockResolvedValueOnce({})
    render(<CreateTeamModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Team Name'), {
      target: { value: 'New Team' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Team' }))

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  test('handles submission errors', async () => {
    const error = new Error('Failed to create team')
    mockOnSubmit.mockRejectedValueOnce(error)
    
    render(<CreateTeamModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Team Name'), {
      target: { value: 'New Team' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Team' }))

    // Check that error is handled and form is re-enabled
    await waitFor(() => {
      expect(screen.getByLabelText('Team Name')).not.toBeDisabled()
      expect(screen.getByRole('button', { name: 'Create Team' })).not.toBeDisabled()
    })

    expect(mockOnClose).not.toHaveBeenCalled()
  })
}) 