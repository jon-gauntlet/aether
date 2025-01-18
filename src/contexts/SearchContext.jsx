import { createContext, useContext, useState, useCallback } from 'react'
import { supabase } from '../utils/supabase'

const SearchContext = createContext({})

export function SearchProvider({ children }) {
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const searchMessages = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from(import.meta.env.VITE_SUPABASE_TABLE_MESSAGES)
        .select('*, user:user_id(email)')
        .textSearch('text', query)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  return (
    <SearchContext.Provider value={{
      searchResults,
      isSearching,
      searchQuery,
      setSearchQuery,
      searchMessages
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
} 