import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutonomic } from '../useAutonomic'
import { DeployGuard } from '../../protection/DeployGuard'

// Mock Firebase
vi.mock('@/core/firebase', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  setDoc: vi.fn(),
  Timestamp: {
    now: () => ({ seconds: 1234567890, nanoseconds: 0 })
  }
}))

vi.mock('@/core/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' },
    consciousnessState: { level: 0.9 }
  })
}))

describe('useAutonomic', () => {
  const mockField = {
    id: 'field1',
    type: 'energy',
    level: 75,
    isActive: true
  }

  const mockConsciousness = {
    id: 'consciousness1',
    awarenessLevel: 85,
    isCoherent: true
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  // Create a wrapper component that provides DeployGuard
  const wrapper = ({ children }) => (
    <DeployGuard>{children}</DeployGuard>
  )

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAutonomic(), { wrapper })
    
    expect(result.current.field).toBeDefined()
    expect(result.current.consciousness).toBeDefined()
    expect(result.current.isActive).toBe(true)
  })

  it('updates field state', () => {
    const { result } = renderHook(() => useAutonomic({ field: mockField }), { wrapper })

    act(() => {
      result.current.updateField({ level: 80 })
    })

    expect(result.current.field.level).toBe(80)
  })

  it('updates consciousness state', () => {
    const { result } = renderHook(() => useAutonomic({ consciousness: mockConsciousness }), { wrapper })

    act(() => {
      result.current.updateConsciousness({ awarenessLevel: 90 })
    })

    expect(result.current.consciousness.awarenessLevel).toBe(90)
  })

  it('handles autonomic activation', () => {
    const { result } = renderHook(() => useAutonomic(), { wrapper })

    act(() => {
      result.current.setActive(false)
    })

    expect(result.current.isActive).toBe(false)
  })

  it('synchronizes field and consciousness', () => {
    const { result } = renderHook(() => useAutonomic({
      field: mockField,
      consciousness: mockConsciousness
    }), { wrapper })

    act(() => {
      result.current.synchronize()
    })

    expect(result.current.field.level).toBeCloseTo(result.current.consciousness.awarenessLevel, 1)
  })
}) 