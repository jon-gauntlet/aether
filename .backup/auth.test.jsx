import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { mockSupabase } from '../setup/supabase.mock'

// Mock the supabase import - must be before importing useAuth
vi.mock('../../../shared/utils/supabase', () => ({
  supabase: mockSupabase
}))

import { useAuth, AuthProvider } from '../../src/contexts/AuthContext'

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
  })

  it('initializes with null user and loading true', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    // Wait for initial render
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('updates user on session change', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: mockUser } },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.loading).toBe(false)
  })

  it('handles auth state changes', async () => {
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

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    // Wait for initial session to resolve
    await act(async () => {
      await Promise.resolve()
    })

    // Trigger auth state change
    await act(async () => {
      authChangeCallback('SIGNED_IN', { user: mockUser })
      await Promise.resolve()
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('cleans up subscription on unmount', () => {
    const unsubscribe = vi.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValueOnce({
      data: {
        subscription: { unsubscribe }
      }
    })

    const { unmount } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })
    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
}) 