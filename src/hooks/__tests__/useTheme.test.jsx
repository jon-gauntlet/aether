import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from '../useTheme'
import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'

// Mock localStorage
const mockStorage = {}
const localStorageMock = {
  getItem: vi.fn(key => mockStorage[key] ?? null),
  setItem: vi.fn((key, value) => { mockStorage[key] = value }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]) }),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock useColorMode
const mockToggleColorMode = vi.fn()
vi.mock('@chakra-ui/react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useColorMode: () => ({
      colorMode: 'light',
      toggleColorMode: mockToggleColorMode,
    }),
    ChakraProvider: ({ children }) => <>{children}</>,
  }
})

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockToggleColorMode.mockClear()
  })

  const wrapper = ({ children }) => (
    <ChakraProvider>{children}</ChakraProvider>
  )

  it('initializes with default theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
  })

  it('toggles theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
    expect(mockToggleColorMode).toHaveBeenCalled()
  })

  it('persists theme preference', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    expect(mockToggleColorMode).toHaveBeenCalled()
  })

  it('loads persisted theme preference', () => {
    localStorageMock.getItem.mockReturnValue('dark')

    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
  })
}) 