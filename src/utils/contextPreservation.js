import { useEffect, useRef, useCallback } from 'react'

// Session storage key for context data
const CONTEXT_STORAGE_KEY = 'app_context'

// Helper to safely parse JSON
const safeJSONParse = (str, fallback = {}) => {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

// Context preservation hook
export const useContextPreservation = (contextKey, initialState = null) => {
  const contextRef = useRef(null)

  // Load context on mount
  useEffect(() => {
    const storedContext = sessionStorage.getItem(CONTEXT_STORAGE_KEY)
    const parsedContext = safeJSONParse(storedContext)
    
    if (parsedContext[contextKey] !== undefined) {
      contextRef.current = parsedContext[contextKey]
    } else {
      contextRef.current = initialState
    }
  }, [contextKey, initialState])

  // Save context
  const saveContext = useCallback((data) => {
    const storedContext = sessionStorage.getItem(CONTEXT_STORAGE_KEY)
    const parsedContext = safeJSONParse(storedContext)
    
    const updatedContext = {
      ...parsedContext,
      [contextKey]: data
    }
    
    sessionStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(updatedContext))
    contextRef.current = data
  }, [contextKey])

  // Clear context
  const clearContext = useCallback(() => {
    const storedContext = sessionStorage.getItem(CONTEXT_STORAGE_KEY)
    const parsedContext = safeJSONParse(storedContext)
    
    delete parsedContext[contextKey]
    
    sessionStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(parsedContext))
    contextRef.current = null
  }, [contextKey])

  return {
    context: contextRef.current,
    saveContext,
    clearContext
  }
}

// Form state preservation hook
export const useFormPreservation = (formId, initialValues = {}) => {
  const { context, saveContext, clearContext } = useContextPreservation(
    `form_${formId}`,
    initialValues
  )

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    saveContext({
      ...context,
      [name]: value
    })
  }, [context, saveContext])

  const resetForm = useCallback(() => {
    clearContext()
  }, [clearContext])

  return {
    formValues: context || initialValues,
    handleChange,
    resetForm
  }
}

// Scroll position preservation hook
export const useScrollPreservation = (elementId) => {
  const { context, saveContext } = useContextPreservation(
    `scroll_${elementId}`,
    { top: 0, left: 0 }
  )

  useEffect(() => {
    const element = document.getElementById(elementId)
    if (!element) return

    // Restore scroll position
    if (context) {
      element.scrollTop = context.top
      element.scrollLeft = context.left
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      saveContext({
        top: element.scrollTop,
        left: element.scrollLeft
      })
    }

    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
  }, [elementId, context, saveContext])
}

// Tab state preservation hook
export const useTabPreservation = (tabGroupId, defaultTab) => {
  const { context, saveContext } = useContextPreservation(
    `tabs_${tabGroupId}`,
    defaultTab
  )

  const setActiveTab = useCallback((tabId) => {
    saveContext(tabId)
  }, [saveContext])

  return {
    activeTab: context || defaultTab,
    setActiveTab
  }
}

// Filter state preservation hook
export const useFilterPreservation = (filterId, initialFilters = {}) => {
  const { context, saveContext, clearContext } = useContextPreservation(
    `filters_${filterId}`,
    initialFilters
  )

  const setFilters = useCallback((filters) => {
    saveContext(filters)
  }, [saveContext])

  const updateFilter = useCallback((key, value) => {
    saveContext({
      ...context,
      [key]: value
    })
  }, [context, saveContext])

  const resetFilters = useCallback(() => {
    clearContext()
  }, [clearContext])

  return {
    filters: context || initialFilters,
    setFilters,
    updateFilter,
    resetFilters
  }
}

// Search state preservation hook
export const useSearchPreservation = (searchId) => {
  const { context, saveContext, clearContext } = useContextPreservation(
    `search_${searchId}`,
    { query: '', results: [] }
  )

  const setSearchState = useCallback((state) => {
    saveContext(state)
  }, [saveContext])

  const updateQuery = useCallback((query) => {
    saveContext({
      ...context,
      query
    })
  }, [context, saveContext])

  const clearSearch = useCallback(() => {
    clearContext()
  }, [clearContext])

  return {
    searchState: context || { query: '', results: [] },
    setSearchState,
    updateQuery,
    clearSearch
  }
} 