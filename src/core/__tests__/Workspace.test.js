import { describe, it, expect, beforeEach } from 'vitest'
import { Workspace } from '../Workspace'

describe('Workspace', () => {
  let workspace

  beforeEach(() => {
    workspace = new Workspace({
      id: 'test-workspace',
      name: 'Test Workspace',
      type: 'development'
    })
  })

  it('initializes with correct properties', () => {
    expect(workspace.id).toBe('test-workspace')
    expect(workspace.name).toBe('Test Workspace')
    expect(workspace.type).toBe('development')
    expect(workspace.state).toBeDefined()
    expect(workspace.metrics).toBeDefined()
  })

  it('tracks state changes', () => {
    workspace.updateState({ focus: 0.8 })
    expect(workspace.state.focus).toBe(0.8)
  })

  it('calculates metrics', () => {
    workspace.updateState({
      focus: 0.8,
      energy: 0.7,
      flow: 0.9
    })

    const metrics = workspace.calculateMetrics()
    expect(metrics.productivity).toBeGreaterThan(0)
    expect(metrics.quality).toBeGreaterThan(0)
    expect(metrics.sustainability).toBeGreaterThan(0)
  })

  it('handles protection levels', () => {
    workspace.setProtectionLevel('high')
    expect(workspace.isProtected()).toBe(true)
    expect(workspace.getProtectionLevel()).toBe('high')

    workspace.setProtectionLevel('low')
    expect(workspace.isProtected()).toBe(false)
    expect(workspace.getProtectionLevel()).toBe('low')
  })

  it('manages energy fields', () => {
    workspace.createEnergyField({
      type: 'focus',
      intensity: 0.8
    })

    const fields = workspace.getEnergyFields()
    expect(fields).toHaveLength(1)
    expect(fields[0].type).toBe('focus')
    expect(fields[0].intensity).toBe(0.8)
  })
}) 