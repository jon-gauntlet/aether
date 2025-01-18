import { useState } from 'react'

function InviteMemberModal({ onClose, onSubmit, teamId }) {
  const [email, setEmail] = useState('')
  const [inviteStage, setInviteStage] = useState(null)

  const stages = {
    VALIDATING: 'Validating email...',
    CHECKING: 'Checking permissions...',
    CREATING: 'Creating invite...',
    SENDING: 'Sending invitation...'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Email validation
      setInviteStage('VALIDATING')
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email address')
      }
      await new Promise(resolve => setTimeout(resolve, 400)) // Simulate validation

      // Permission check
      setInviteStage('CHECKING')
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate check

      // Create invite
      setInviteStage('CREATING')
      await new Promise(resolve => setTimeout(resolve, 400)) // Simulate creation

      // Send invitation
      setInviteStage('SENDING')
      await onSubmit({ email, teamId })

      onClose()
    } catch (error) {
      console.error('Failed to send invite:', error)
      setInviteStage(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Invite Team Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={inviteStage}
              />
            </div>

            {/* Invite Progress */}
            {inviteStage && (
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{stages[inviteStage]}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
              disabled={inviteStage}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-white flex items-center space-x-2 ${
                inviteStage 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={inviteStage}
            >
              {inviteStage ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InviteMemberModal 