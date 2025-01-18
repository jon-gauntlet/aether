import { useState, useEffect, useRef } from 'react'
import { useTeams } from '../contexts/TeamContext'
import CreateTeamModal from '../components/teams/CreateTeamModal'
import InviteMemberModal from '../components/teams/InviteMemberModal'
import TeamListSkeleton from '../components/teams/TeamListSkeleton'

function Teams() {
  const { teams, loading, createTeam, inviteMember } = useTeams()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [focusedTeamIndex, setFocusedTeamIndex] = useState(-1)
  const teamRefs = useRef([])

  // Reset refs array when teams change
  useEffect(() => {
    teamRefs.current = teamRefs.current.slice(0, teams.length)
  }, [teams])

  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        const nextIndex = Math.min(index + 1, teams.length - 1)
        setFocusedTeamIndex(nextIndex)
        teamRefs.current[nextIndex]?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        const prevIndex = Math.max(index - 1, 0)
        setFocusedTeamIndex(prevIndex)
        teamRefs.current[prevIndex]?.focus()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        const team = teams[index]
        setSelectedTeam(team)
        setShowInviteModal(true)
        break
      default:
        break
    }
  }

  const handleCreateTeam = async (formData) => {
    await createTeam(formData)
    setShowCreateModal(false)
  }

  const handleInviteMember = async (data) => {
    await inviteMember(data)
    setShowInviteModal(false)
    setSelectedTeam(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <TeamListSkeleton />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" role="main" aria-label="Teams Management">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Create New Team"
        >
          Create Team
        </button>
      </div>

      <div className="space-y-4" role="list" aria-label="Teams List">
        {teams.map((team, index) => (
          <div 
            key={team.id} 
            ref={el => teamRefs.current[index] = el}
            className={`bg-white rounded-lg shadow p-6 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              focusedTeamIndex === index ? 'ring-2 ring-blue-500' : ''
            }`}
            role="listitem"
            aria-label={`${team.name} Team`}
            tabIndex="0"
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{team.name}</h3>
                {team.description && (
                  <p className="mt-1 text-gray-600" aria-label={`Description: ${team.description}`}>
                    {team.description}
                  </p>
                )}
                <p className="mt-4 text-sm text-gray-500" aria-label={`${team.memberCount} ${team.memberCount === 1 ? 'member' : 'members'}`}>
                  {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedTeam(team)
                    setShowInviteModal(true)
                  }}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Invite Member to ${team.name}`}
                >
                  Invite Member
                </button>
                <button
                  onClick={() => {/* Handle settings */}}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`${team.name} Settings`}
                >
                  Settings
                </button>
              </div>
            </div>

            {team.members?.length > 0 && (
              <div className="mt-4 flex -space-x-2" role="group" aria-label={`${team.name} Members`}>
                {team.members.map(member => (
                  <div
                    key={member.id}
                    className="h-8 w-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                    aria-label={`Team member: ${member.email}`}
                    title={member.email}
                  >
                    {member.email[0].toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTeam}
        />
      )}

      {showInviteModal && selectedTeam && (
        <InviteMemberModal
          teamId={selectedTeam.id}
          onClose={() => {
            setShowInviteModal(false)
            setSelectedTeam(null)
          }}
          onSubmit={handleInviteMember}
        />
      )}
    </div>
  )
}

export default Teams 