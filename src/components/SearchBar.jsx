import { useEffect, useRef, useState } from 'react'
import { useSearch } from '../contexts/SearchContext'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import { debounce } from '../utils/debounce'

function SearchBar() {
  const {
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    searchMessages
  } = useSearch()
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)

  useOnClickOutside(searchRef, () => setShowResults(false))

  const debouncedSearch = debounce((query) => {
    searchMessages(query)
  }, 300)

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery)
    }
  }, [searchQuery, debouncedSearch])

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(date))
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search messages..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              setShowResults(false)
            }}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showResults && (searchQuery || isSearching) && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-auto z-50">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {searchResults.map((result) => (
                <div key={result.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {result.user?.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(result.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {result.text}
                  </p>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default SearchBar 