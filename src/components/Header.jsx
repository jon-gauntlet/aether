import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import SearchBar from './SearchBar'
import NotificationCenter from './NotificationCenter'

function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef()

  useOnClickOutside(dropdownRef, () => setShowDropdown(false))

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  return (
    <header className="bg-white border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 max-w-2xl">
          <h1 className="text-xl font-bold text-gray-900 mr-8">Project Claude</h1>
          <SearchBar />
        </div>

        <div className="flex items-center space-x-4">
          <NotificationCenter />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700">{user?.email}</span>
              <svg
                className={`w-4 h-4 text-gray-500 transform transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">Signed in as</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    navigate('/profile')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Your Profile
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    navigate('/settings')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </button>
                <div className="border-t">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 