import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { useNotifications } from './NotificationContext'

const TeamContext = createContext({})

const TEAMS_PER_PAGE = 10

export function TeamProvider({ children }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTeam, setCurrentTeam] = useState(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const { addNotification } = useNotifications()

  // Memoized team selection logic
  const currentTeamMembers = useMemo(() => {
    return currentTeam?.members || []
  }, [currentTeam])

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )
  }, [teams])

  const paginatedTeams = useMemo(() => {
    const start = (page - 1) * TEAMS_PER_PAGE
    return sortedTeams.slice(start, start + TEAMS_PER_PAGE)
  }, [sortedTeams, page])

  const fetchTeams = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true)
      
      // Get total count first
      const { count, error: countError } = await supabase
        .from('teams')
        .select('id', { count: 'exact' })

      if (countError) throw countError
      setTotalCount(count)

      // Then fetch paginated data
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          members:team_members(
            user_id,
            role,
            user:users(email)
          )
        `)
        .range(
          (pageNum - 1) * TEAMS_PER_PAGE,
          pageNum * TEAMS_PER_PAGE - 1
        )
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeams(data)
      setPage(pageNum)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to load teams',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  // Batch team operations
  const batchUpdateTeams = useCallback(async (operations) => {
    try {
      const { data, error } = await supabase
        .rpc('batch_team_operations', { operations })

      if (error) throw error
      
      // Update local state based on operation type
      setTeams(prevTeams => {
        const updatedTeams = [...prevTeams]
        operations.forEach(op => {
          switch (op.type) {
            case 'create':
              updatedTeams.unshift(op.team)
              break
            case 'update':
              const updateIndex = updatedTeams.findIndex(t => t.id === op.team.id)
              if (updateIndex !== -1) {
                updatedTeams[updateIndex] = { ...updatedTeams[updateIndex], ...op.team }
              }
              break
            case 'delete':
              const deleteIndex = updatedTeams.findIndex(t => t.id === op.teamId)
              if (deleteIndex !== -1) {
                updatedTeams.splice(deleteIndex, 1)
              }
              break
            default:
              break
          }
        })
        return updatedTeams
      })

      return data
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to update teams',
        message: error.message
      })
      throw error
    }
  }, [addNotification])

  const createTeam = useCallback(async (name, description) => {
    try {
      const operation = {
        type: 'create',
        team: { name, description }
      }
      const data = await batchUpdateTeams([operation])
      
      addNotification({
        type: 'success',
        title: 'Team created',
        message: `${name} has been created successfully.`
      })

      return data[0]
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to create team',
        message: error.message
      })
      throw error
    }
  }, [batchUpdateTeams, addNotification])

  const inviteMember = useCallback(async (teamId, email) => {
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .insert([{ team_id: teamId, email }])
        .select()
        .single()

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'Invitation sent',
        message: `Invitation sent to ${email}`
      })

      return data
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to send invitation',
        message: error.message
      })
      throw error
    }
  }, [addNotification])

  return (
    <TeamContext.Provider value={{
      teams: paginatedTeams,
      totalTeams: totalCount,
      currentPage: page,
      loading,
      currentTeam,
      currentTeamMembers,
      setCurrentTeam,
      fetchTeams,
      createTeam,
      inviteMember,
      batchUpdateTeams
    }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeams = () => {
  const context = useContext(TeamContext)
  if (!context) {
    throw new Error('useTeams must be used within a TeamProvider')
  }
  return context
} 