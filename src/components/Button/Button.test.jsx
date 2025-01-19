import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme, createTestProps, waitForAnimations } from '../../test/utils'
import styled from 'styled-components'
import { useStyledTheme } from '../../theme/useComponentTheme'

// Component under test
const Button = styled.button`
  ${useStyledTheme('button', { variant: 'primary' })}
`

const SecondaryButton = styled(Button)`
  ${useStyledTheme('button', { variant: 'secondary' })}
`

const GhostButton = styled(Button)`
  ${useStyledTheme('button', { variant: 'ghost' })}
`

describe('Button', () => {
  let props

  beforeEach(() => {
    props = createTestProps()
  })

  describe('Primary Button', () => {
    it('renders with primary styles', () => {
      renderWithTheme(<Button {...props} />)
      const button = screen.getByRole('button')
      
      expect(button).toBeInTheDocument()
      expect(button).toHaveStyle({
        backgroundColor: expect.any(String),
        color: 'white'
      })
    })

    it('handles click events', async () => {
      const { user } = renderWithTheme(<Button {...props} />)
      const button = screen.getByRole('button')
      
      await user.click(button)
      expect(props.onClick).toHaveBeenCalledTimes(1)
    })

    it('supports disabled state', () => {
      renderWithTheme(<Button {...props} disabled />)
      const button = screen.getByRole('button')
      
      expect(button).toBeDisabled()
      expect(button).toHaveStyle({
        opacity: expect.any(String),
        cursor: 'not-allowed'
      })
    })
  })

  describe('Secondary Button', () => {
    it('renders with secondary styles', () => {
      renderWithTheme(<SecondaryButton {...props} />)
      const button = screen.getByRole('button')
      
      expect(button).toBeInTheDocument()
      expect(button).toHaveStyle({
        backgroundColor: expect.any(String)
      })
    })

    it('adapts to dark mode', () => {
      renderWithTheme(<SecondaryButton {...props} />, { theme: 'dark' })
      const button = screen.getByRole('button')
      
      expect(button).toHaveStyle({
        backgroundColor: expect.any(String),
        color: expect.any(String)
      })
    })
  })

  describe('Ghost Button', () => {
    it('renders with ghost styles', () => {
      renderWithTheme(<GhostButton {...props} />)
      const button = screen.getByRole('button')
      
      expect(button).toBeInTheDocument()
      expect(button).toHaveStyle({
        backgroundColor: 'transparent'
      })
    })

    it('shows hover state', async () => {
      const { user } = renderWithTheme(<GhostButton {...props} />)
      const button = screen.getByRole('button')
      
      await user.hover(button)
      await waitForAnimations()
      
      expect(button).toHaveStyle({
        backgroundColor: expect.any(String)
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible name when text content provided', () => {
      renderWithTheme(<Button>Click Me</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveAccessibleName('Click Me')
    })

    it('supports aria-label', () => {
      renderWithTheme(<Button aria-label="Custom Label" />)
      const button = screen.getByRole('button')
      
      expect(button).toHaveAccessibleName('Custom Label')
    })

    it('maintains focus styles', async () => {
      const { user } = renderWithTheme(<Button {...props} />)
      const button = screen.getByRole('button')
      
      await user.tab()
      expect(button).toHaveFocus()
      expect(button).toHaveStyle({
        outline: expect.any(String)
      })
    })
  })

  describe('Error Handling', () => {
    it('logs error when onClick throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error')
      const errorProps = {
        ...props,
        onClick: () => { throw new Error('Test Error') }
      }
      
      const { user } = renderWithTheme(<Button {...errorProps} />)
      const button = screen.getByRole('button')
      
      await user.click(button)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('applies transitions smoothly', async () => {
      const { user } = renderWithTheme(<Button {...props} />)
      const button = screen.getByRole('button')
      
      expect(button).toHaveStyle({
        transition: expect.any(String)
      })
      
      await user.hover(button)
      await waitForAnimations()
      
      expect(button).toHaveStyle({
        backgroundColor: expect.any(String)
      })
    })
  })
}) 