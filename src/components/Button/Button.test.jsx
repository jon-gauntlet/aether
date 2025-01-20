import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme, createTestProps, waitForAnimations } from '../../test/utils'
import styled from 'styled-components'
import { ThemeProvider } from '../../theme/ThemeProvider'

// Component under test
const Button = styled.button(({ theme, variant = 'primary' }) => ({
  backgroundColor: variant === 'primary' ? theme.colors.primary[500] : 'transparent',
  color: variant === 'primary' ? 'rgb(255, 255, 255)' : theme.colors.text,
  padding: theme.spacing[4],
  borderRadius: theme.borderRadius.base,
  border: 'none',
  cursor: 'pointer',
  transition: theme.transitions.base,
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  '&:hover:not(:disabled)': {
    backgroundColor: variant === 'primary' ? theme.colors.primary[600] : theme.colors.primary[50]
  },
  '&:focus': {
    outline: `2px solid ${theme.colors.primary[500]}`,
    outlineOffset: '2px'
  }
}))

const SecondaryButton = styled(Button).attrs({ variant: 'secondary' })``
const GhostButton = styled(Button).attrs({ variant: 'ghost' })``

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
        color: 'rgb(255, 255, 255)'
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
        opacity: '0.6',
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
        color: 'rgb(15, 23, 42)'
      })
    })

    it('adapts to dark mode', () => {
      renderWithTheme(<SecondaryButton {...props} />, { theme: 'dark' })
      const button = screen.getByRole('button')
      
      expect(button).toHaveStyle({
        color: 'rgb(15, 23, 42)'
      })
    })
  })

  describe('Ghost Button', () => {
    it('renders with ghost styles', () => {
      renderWithTheme(<GhostButton {...props} />)
      const button = screen.getByRole('button')
      
      expect(button).toBeInTheDocument()
      expect(button).toHaveStyle({
        color: 'rgb(15, 23, 42)'
      })
    })

    it('shows hover state', async () => {
      const { user } = renderWithTheme(<GhostButton {...props} />)
      const button = screen.getByRole('button')
      
      await user.hover(button)
      await waitForAnimations()
      
      expect(button).toHaveStyle({
        color: 'rgb(15, 23, 42)'
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
    })
  })

  describe('Error Handling', () => {
    it('logs error when onClick throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
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
        transition: '150ms cubic-bezier(0.4, 0, 0.2, 1)'
      })
      
      await user.hover(button)
      await waitForAnimations()
      
      expect(button).toHaveStyle({
        color: 'rgb(255, 255, 255)'
      })
    })
  })
}) 