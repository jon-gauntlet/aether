import { useState, useEffect, useRef } from 'react'

function CreateTeamModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [progress, setProgress] = useState({
    stage: null,
    percent: 0
  })
  
  const modalRef = useRef(null)
  const nameInputRef = useRef(null)
  const cancelButtonRef = useRef(null)
  const submitButtonRef = useRef(null)

  useEffect(() => {
    // Set initial focus
    nameInputRef.current?.focus()

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !progress.stage) {
        onClose()
      }
    }

    // Focus trap
    const handleTab = (e) => {
      if (!modalRef.current) return
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleTab)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTab)
    }
  }, [progress.stage, onClose])

  const stages = {
    VALIDATING: { name: 'Validating', percent: 25 },
    CREATING: { name: 'Creating Team', percent: 50 },
    SETTING_UP: { name: 'Setting Up', percent: 75 },
    NOTIFYING: { name: 'Finalizing', percent: 90 },
    COMPLETE: { name: 'Complete', percent: 100 }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Validation stage
      setProgress({ stage: 'VALIDATING', percent: stages.VALIDATING.percent })
      if (!formData.name.trim()) {
        throw new Error('Team name is required')
      }
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate validation

      // Creation stage
      setProgress({ stage: 'CREATING', percent: stages.CREATING.percent })
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate DB operation

      // Setup stage
      setProgress({ stage: 'SETTING_UP', percent: stages.SETTING_UP.percent })
      await onSubmit(formData)

      // Notification stage
      setProgress({ stage: 'NOTIFYING', percent: stages.NOTIFYING.percent })
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate notification

      // Complete
      setProgress({ stage: 'COMPLETE', percent: stages.COMPLETE.percent })
      await new Promise(resolve => setTimeout(resolve, 200)) // Show completion briefly

      onClose()
    } catch (error) {
      console.error('Failed to create team:', error)
      setProgress({ stage: null, percent: 0 })
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full p-6"
        role="document"
      >
        <h2 id="modal-title" className="text-xl font-bold text-gray-900 mb-4">Create Team</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">
                Team Name
              </label>
              <input
                ref={nameInputRef}
                id="team-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={progress.stage}
                aria-required="true"
                aria-label="Enter team name"
              />
            </div>
            <div>
              <label htmlFor="team-description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="team-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                disabled={progress.stage}
                aria-label="Enter team description"
              />
            </div>

            {/* Progress Indicator */}
            {progress.stage && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{stages[progress.stage].name}</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={progress.stage}
              aria-label="Cancel team creation"
            >
              Cancel
            </button>
            <button
              ref={submitButtonRef}
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={progress.stage || !formData.name.trim()}
              aria-label="Create new team"
            >
              {progress.stage ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTeamModal 