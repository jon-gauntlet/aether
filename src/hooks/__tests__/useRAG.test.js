import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { mockRAGService } from '@/test/utils'
import useRAG from '@/hooks/useRAG'

const mockService = mockRAGService()

vi.mock('@/services/rag', () => ({
  default: mockService
}))

describe('useRAG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useRAG())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.results).toEqual([])
  })

  it('handles search operations', async () => {
    const mockResults = [{ id: 1, text: 'test result' }]
    mockService.search.mockResolvedValueOnce(mockResults)

    const { result } = renderHook(() => useRAG())

    await act(async () => {
      await result.current.search('test query')
    })

    expect(mockService.search).toHaveBeenCalledWith('test query')
    expect(result.current.results).toEqual(mockResults)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles search errors', async () => {
    const mockError = new Error('Search failed')
    mockService.search.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useRAG())

    await act(async () => {
      await result.current.search('test query')
    })

    expect(mockService.search).toHaveBeenCalledWith('test query')
    expect(result.current.error).toBe(mockError)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.results).toEqual([])
  })

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useRAG())
    unmount()
    expect(mockService.cleanup).toHaveBeenCalled()
  })
}) 