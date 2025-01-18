import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Teams from '../../../pages/Teams'
import { useTeams } from '../../../contexts/TeamContext'

// Mock the TeamContext hook
vi.mock('../../../contexts/TeamContext', () => ({
  useTeams: vi.fn()
}))

describe('Teams Component', () => {
  const mockTeams = [
    {
      id: 1,
      name: 'Engineering',
      description: 'Core engineering team',
      memberCount: 3,
      members: [
        { id: 1, email: 'john@example.com' },
        { id: 2, email: 'jane@example.com' },
        { id: 3, email: 'bob@example.com' }
      ]
    },
    {
      id: 2,
      name: 'Design',
      description: 'Design team',
      memberCount: 2,
      members: [
        { id: 4, email: 'alice@example.com' },
        { id: 5, email: 'charlie@example.com' }
      ]
    }
  ]

  const mockTeamContext = {
    teams: mockTeams,
    loading: false,
    createTeam: vi.fn(),
    inviteMember: vi.fn()
  }

  beforeEach(() => {
    useTeams.mockReturnValue(mockTeamContext)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders loading skeleton when loading is true', () => {
    useTeams.mockReturnValue({ ...mockTeamContext, loading: true })
    render(<Teams />)
    
    // Check for skeleton elements
    expect(screen.getByTestId('team-list-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Create Team')).not.toBeInTheDocument()
  })

  test('renders teams list when loading is false', () => {
    render(<Teams />)
    
    // Check for team names
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Design')).toBeInTheDocument()
    
    // Check for descriptions
    expect(screen.getByText('Core engineering team')).toBeInTheDocument()
    expect(screen.getByText('Design team')).toBeInTheDocument()
    
    // Check for member counts
    expect(screen.getByText('3 members')).toBeInTheDocument()
    expect(screen.getByText('2 members')).toBeInTheDocument()
  })

  test('opens create team modal when create button is clicked', () => {
    render(<Teams />)
    
    const createButton = screen.getByText('Create Team')
    fireEvent.click(createButton)
    
    expect(screen.getByText('Create Team', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByLabelText('Team Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  test('opens invite member modal when invite button is clicked', () => {
    render(<Teams />)
    
    const inviteButtons = screen.getAllByText('Invite Member')
    fireEvent.click(inviteButtons[0]) // Click first team's invite button
    
    expect(screen.getByText('Invite Team Member')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
  })

  test('handles team creation', async () => {
    render(<Teams />)
    
    // Open create modal
    fireEvent.click(screen.getByText('Create Team'))
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Team Name'), {
      target: { value: 'New Team' }
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New team description' }
    })
    
    // Submit form
    fireEvent.click(screen.getByText('Create Team', { selector: 'button' }))
    
    await waitFor(() => {
      expect(mockTeamContext.createTeam).toHaveBeenCalledWith({
        name: 'New Team',
        description: 'New team description'
      })
    })
  })

  test('handles member invitation', async () => {
    render(<Teams />)
    
    // Open invite modal
    const inviteButtons = screen.getAllByText('Invite Member')
    fireEvent.click(inviteButtons[0])
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'new@example.com' }
    })
    
    // Submit form
    fireEvent.click(screen.getByText('Send Invite'))
    
    await waitFor(() => {
      expect(mockTeamContext.inviteMember).toHaveBeenCalledWith({
        email: 'new@example.com',
        teamId: mockTeams[0].id
      })
    })
  })

  test('displays member avatars with correct initials', () => {
    render(<Teams />)
    
    const memberInitials = screen.getAllByTitle(/.*@example.com/)
    expect(memberInitials).toHaveLength(5) // Total members across all teams
    
    // Check first member's initial
    expect(memberInitials[0].textContent).toBe('J') // john@example.com
  })

  test('disables buttons during loading states', async () => {
    render(<Teams />)
    
    // Open create modal
    fireEvent.click(screen.getByText('Create Team'))
    
    // Submit form
    fireEvent.click(screen.getByText('Create Team', { selector: 'button' }))
    
    // Check that buttons are disabled during creation
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeDisabled()
      expect(screen.getByText('Creating...')).toBeDisabled()
    })
  })
}) 