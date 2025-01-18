import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../src/contexts/AuthContext'
import { mockSupabase } from '../setup/supabase.mock'

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with null user and loading true', () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null }
    })

    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('should update user on session change', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: mockUser } }
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.loading).toBe(false)
  })

  it('should handle auth state changes', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    let authChangeCallback

    mockSupabase.auth.onAuthStateChange.mockImplementationOnce((callback) => {
      authChangeCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      authChangeCallback('SIGNED_IN', { user: mockUser })
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('should cleanup subscription on unmount', () => {
    const unsubscribe = vi.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValueOnce({
      data: {
        subscription: { unsubscribe }
      }
    })

    const { unmount } = renderHook(() => useAuth())
    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
}) 