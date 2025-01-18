import { describe, it, expect } from 'vitest'
import { toBeInRange } from '../../utils/toBeInRange'

describe('toBeInRange', () => {
  it('validates number is within range', () => {
    const value = 5
    const min = 0
    const max = 10
    
    const result = toBeInRange(value, min, max)
    expect(result.pass).toBe(true)
  })

  it('fails when number is below range', () => {
    const value = -1
    const min = 0
    const max = 10
    
    const result = toBeInRange(value, min, max)
    expect(result.pass).toBe(false)
    expect(result.message()).toMatch(/expected.*to be within range/)
  })

  it('fails when number is above range', () => {
    const value = 11
    const min = 0
    const max = 10
    
    const result = toBeInRange(value, min, max)
    expect(result.pass).toBe(false)
    expect(result.message()).toMatch(/expected.*to be within range/)
  })

  it('handles edge cases', () => {
    expect(toBeInRange(0, 0, 10).pass).toBe(true)
    expect(toBeInRange(10, 0, 10).pass).toBe(true)
    expect(toBeInRange(5.5, 5, 6).pass).toBe(true)
  })
})