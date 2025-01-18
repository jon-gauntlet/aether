function TeamListSkeleton() {
  return (
    <div className="space-y-4" data-testid="skeleton-container">
      {[...Array(3)].map((_, index) => (
        <div 
          key={index} 
          className="bg-white rounded-lg shadow p-6 animate-pulse"
          data-testid="team-skeleton-card"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              {/* Team name */}
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              
              {/* Description */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>

              {/* Member count */}
              <div className="h-4 bg-gray-200 rounded w-24 mt-4"></div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2">
              <div className="h-9 w-24 bg-gray-200 rounded"></div>
              <div className="h-9 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Member avatars */}
          <div className="mt-4 flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white"
                data-testid="member-avatar-skeleton"
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default TeamListSkeleton 