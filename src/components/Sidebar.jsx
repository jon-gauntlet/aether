import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOnlineUsers } from '../hooks/useOnlineUsers'

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const onlineUsers = useOnlineUsers()

  const navigation = [
    {
      name: 'Chat',
      path: '/',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      name: 'Teams',
      path: '/teams',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      name: 'Files',
      path: '/files',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ]

  return (
    <div 
      className={`bg-gray-800 text-white flex flex-col transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <span className="text-lg font-semibold">Project Claude</span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-gray-700"
        >
          <svg 
            className={`w-6 h-6 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-2 space-x-3
                ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}
                ${isCollapsed ? 'justify-center' : ''}`}
            >
              {item.icon}
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="space-y-4">
          {!isCollapsed && (
            <h3 className="text-sm font-semibold text-gray-400">
              Online Users ({onlineUsers.length})
            </h3>
          )}
          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <div
                key={user.user_id}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-sm">{user.email.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-800" />
                </div>
                {!isCollapsed && (
                  <span className="text-sm truncate max-w-[150px]">{user.email}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar 