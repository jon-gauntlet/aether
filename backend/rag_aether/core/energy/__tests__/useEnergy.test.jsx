import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEnergy } from '../useEnergy'

const ENERGY_TYPES = {
  PHYSICAL: 'physical',
  MENTAL: 'mental',
  EMOTIONAL: 'emotional'
}

describe('useEnergy', () => {
  const mockInitialState = {
    energyLevel: 100,
    type: ENERGY_TYPES.PHYSICAL,
    isActive: true
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useEnergy())
    
    expect(result.current.energyLevel).toBe(100)
    expect(result.current.type).toBe(ENERGY_TYPES.PHYSICAL)
    expect(result.current.isActive).toBe(true)
  })

  it('updates energy level', () => {
    const { result } = renderHook(() => useEnergy(mockInitialState))

    act(() => {
      result.current.updateEnergyLevel(80)
    })

    expect(result.current.energyLevel).toBe(80)
  })

  it('regenerates energy over time', () => {
    const { result } = renderHook(() => useEnergy({
      ...mockInitialState,
      energyLevel: 50
    }))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.energyLevel).toBeGreaterThan(50)
  })

  it('handles energy type changes', () => {
    const { result } = renderHook(() => useEnergy(mockInitialState))

    act(() => {
      result.current.setType(ENERGY_TYPES.MENTAL)
    })

    expect(result.current.type).toBe(ENERGY_TYPES.MENTAL)
  })

  it('toggles active state', () => {
    const { result } = renderHook(() => useEnergy(mockInitialState))

    act(() => {
      result.current.toggleActive()
    })

    expect(result.current.isActive).toBe(false)
  })
}) 