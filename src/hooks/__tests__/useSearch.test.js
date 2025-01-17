import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { mockSearchService } from '@/test/utils'
import useSearch from '@/hooks/useSearch'

const mockService = mockSearchService()

vi.mock('@/services/search', () => ({
  searchService: mockService
}))

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useSearch())
    
    expect(result.current.query).toBe('')
    expect(result.current.results).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('updates query state', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test query')
    })

    expect(result.current.query).toBe('test query')
  })

  it('performs search successfully', async () => {
    const mockResults = [{ id: 1, title: 'Test Result' }]
    mockService.search.mockResolvedValueOnce(mockResults)

    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.performSearch('test')
    })

    expect(mockService.search).toHaveBeenCalledWith('test')
    expect(result.current.results).toEqual(mockResults)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles search error', async () => {
    const error = new Error('Search failed')
    mockService.search.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.performSearch('test')
    })

    expect(mockService.search).toHaveBeenCalledWith('test')
    expect(result.current.results).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(error)
  })

  it('shows loading state during search', async () => {
    mockService.search.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve([]), 100)
    }))

    const { result } = renderHook(() => useSearch())

    const searchPromise = act(async () => {
      await result.current.performSearch('test')
    })

    expect(result.current.isLoading).toBe(true)

    await searchPromise
    expect(result.current.isLoading).toBe(false)
  })

  it('clears results when query is empty', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('')
    })

    expect(result.current.results).toEqual([])
  })

  it('debounces search calls', async () => {
    const { result } = renderHook(() => useSearch())

    await act(async () => {
      result.current.setQuery('t')
      result.current.setQuery('te')
      result.current.setQuery('test')
    })

    expect(mockService.search).toHaveBeenCalledTimes(1)
    expect(mockService.search).toHaveBeenCalledWith('test')
  })
}) 