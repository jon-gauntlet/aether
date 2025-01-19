import { useTheme } from './ThemeProvider'
import { getComponentTheme } from './componentThemes'

/**
 * Hook for accessing component themes with current theme context
 * @param {string} component - The component name to get theme for
 * @param {string} [variant='default'] - Optional variant of the component
 * @returns {Object} The component's theme styles
 * 
 * @example
 * const Button = styled.button`
 *   ${useComponentTheme('button', 'primary')}
 * `
 */
export const useComponentTheme = (component, variant = 'default') => {
  const { theme } = useTheme()
  const componentTheme = getComponentTheme(component, variant)
  
  // Handle function-based theme properties
  const resolvedTheme = Object.entries(componentTheme).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'function' ? value(theme) : value
    return acc
  }, {})

  return resolvedTheme
}

/**
 * Hook for creating styled-components with theme support
 * @param {string} component - The component name to get theme for
 * @param {Object} options - Options for the component
 * @param {string} [options.variant='default'] - Component variant
 * @param {Object} [options.extend={}] - Additional styles to extend the theme with
 * @returns {Function} Styled-components template literal
 * 
 * @example
 * const Button = styled.button`
 *   ${useStyledTheme('button', { 
 *     variant: 'primary',
 *     extend: { padding: '1rem' }
 *   })}
 * `
 */
export const useStyledTheme = (component, { variant = 'default', extend = {} } = {}) => {
  const { theme } = useTheme()
  const componentTheme = getComponentTheme(component, variant)
  
  return (props) => {
    // Resolve function-based theme properties
    const resolvedTheme = Object.entries(componentTheme).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'function' ? value(theme) : value
      return acc
    }, {})

    // Merge with extended styles
    const extendedStyles = typeof extend === 'function' ? extend(theme) : extend
    return { ...resolvedTheme, ...extendedStyles }
  }
}

/**
 * Hook for dynamic component themes
 * @param {string} component - The component name to get theme for
 * @param {Object} options - Options for the component
 * @param {string} [options.variant='default'] - Component variant
 * @param {Object} [options.state={}] - Component state (hover, active, etc.)
 * @returns {Object} The component's theme styles for the current state
 * 
 * @example
 * const buttonTheme = useDynamicTheme('button', {
 *   variant: 'primary',
 *   state: { isHovered: true }
 * })
 */
export const useDynamicTheme = (component, { variant = 'default', state = {} } = {}) => {
  const { theme } = useTheme()
  const baseTheme = getComponentTheme(component, variant)
  
  // Resolve base theme
  const resolvedBase = Object.entries(baseTheme).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'function' ? value(theme) : value
    return acc
  }, {})

  // Apply state-specific styles
  const { isHovered, isActive, isFocused, isDisabled } = state
  const stateStyles = {
    ...(isHovered && resolvedBase['&:hover']),
    ...(isActive && resolvedBase['&:active']),
    ...(isFocused && resolvedBase['&:focus']),
    ...(isDisabled && resolvedBase['&:disabled'])
  }

  return { ...resolvedBase, ...stateStyles }
}

/**
 * Hook for responsive component themes
 * @param {string} component - The component name to get theme for
 * @param {Object} options - Options for the component
 * @param {string} [options.variant='default'] - Component variant
 * @param {Object} [options.breakpoints={}] - Breakpoint-specific styles
 * @returns {Array} Array of styled-components CSS for different breakpoints
 * 
 * @example
 * const Button = styled.button`
 *   ${useResponsiveTheme('button', {
 *     variant: 'primary',
 *     breakpoints: {
 *       sm: { padding: '0.5rem' },
 *       md: { padding: '1rem' }
 *     }
 *   })}
 * `
 */
export const useResponsiveTheme = (component, { variant = 'default', breakpoints = {} } = {}) => {
  const { theme } = useTheme()
  const baseTheme = getComponentTheme(component, variant)
  
  // Resolve base theme
  const resolvedBase = Object.entries(baseTheme).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'function' ? value(theme) : value
    return acc
  }, {})

  // Create responsive styles
  const responsiveStyles = Object.entries(breakpoints).map(([breakpoint, styles]) => {
    const query = theme.mediaQueries[breakpoint]
    if (!query) return null
    
    const breakpointStyles = typeof styles === 'function' ? styles(theme) : styles
    return `
      ${query} {
        ${Object.entries(breakpointStyles)
          .map(([prop, value]) => `${prop}: ${value};`)
          .join('\n')}
      }
    `
  })

  return [resolvedBase, ...responsiveStyles.filter(Boolean)]
} 