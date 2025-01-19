import { css } from 'styled-components'
import { mediaQueries } from './tokens'

/**
 * Creates responsive styles using breakpoints
 * @param {Object} styles - Styles for different breakpoints
 * @returns {Array} Array of styled-components CSS
 * @example
 * const Component = styled.div`
 *   ${responsive({
 *     sm: css`color: red;`,
 *     md: css`color: blue;`,
 *     lg: css`color: green;`
 *   })}
 * `
 */
export const responsive = (styles) => {
  return Object.entries(styles).map(([breakpoint, style]) => {
    if (breakpoint === 'base') return style
    const query = mediaQueries[breakpoint]
    if (!query) return null
    return css`
      ${query} {
        ${style}
      }
    `
  })
}

/**
 * Creates dark mode styles
 * @param {string|Function} styles - CSS styles or function returning styles
 * @returns {Function} Styled-components CSS
 * @example
 * const Component = styled.div`
 *   color: ${props => props.theme.colors.foreground};
 *   ${darkMode`
 *     color: white;
 *     background: black;
 *   `}
 * `
 */
export const darkMode = (styles) => css`
  ${({ theme }) =>
    theme.isDark &&
    css`
      ${typeof styles === 'function' ? styles({ theme }) : styles}
    `}
`

/**
 * Creates focus styles with keyboard-only focus ring
 * @param {Object} options - Focus style options
 * @returns {Function} Styled-components CSS
 * @example
 * const Button = styled.button`
 *   ${focusRing()}
 * `
 */
export const focusRing = ({
  color = 'primary',
  offset = '2px',
  width = '3px',
  radius = '4px'
} = {}) => css`
  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: none;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: -${offset};
      right: -${offset};
      bottom: -${offset};
      left: -${offset};
      border: ${width} solid ${({ theme }) => theme.colors[color]};
      border-radius: calc(${radius} + ${offset});
      pointer-events: none;
    }
  }
`

/**
 * Creates truncated text with ellipsis
 * @param {number} lines - Number of lines before truncating
 * @returns {Object} CSS properties for truncation
 * @example
 * const Text = styled.p`
 *   ${truncate(2)}
 * `
 */
export const truncate = (lines = 1) => ({
  display: '-webkit-box',
  '-webkit-line-clamp': lines,
  '-webkit-box-orient': 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

/**
 * Creates styles for visually hidden elements (accessible to screen readers)
 * @returns {Object} CSS properties for visual hiding
 * @example
 * const ScreenReaderOnly = styled.span`
 *   ${visuallyHidden}
 * `
 */
export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

/**
 * Creates styles for disabled states
 * @param {Object} options - Disabled style options
 * @returns {Function} Styled-components CSS
 * @example
 * const Button = styled.button`
 *   ${disabledStyles()}
 * `
 */
export const disabledStyles = ({
  opacity = 0.6,
  cursor = 'not-allowed'
} = {}) => css`
  &:disabled {
    opacity: ${opacity};
    cursor: ${cursor};
    pointer-events: none;
  }
`

/**
 * Creates hover styles with support for touch devices
 * @param {string|Function} styles - CSS styles or function returning styles
 * @returns {Function} Styled-components CSS
 * @example
 * const Button = styled.button`
 *   ${hover`
 *     background: ${props => props.theme.colors.primary};
 *   `}
 * `
 */
export const hover = (styles) => css`
  @media (hover: hover) {
    &:hover {
      ${typeof styles === 'function' ? styles : css`${styles}`}
    }
  }
`

/**
 * Creates styles for reduced motion preference
 * @param {string|Function} styles - CSS styles or function returning styles
 * @returns {Function} Styled-components CSS
 * @example
 * const Animation = styled.div`
 *   animation: bounce 1s;
 *   ${reduceMotion`
 *     animation: none;
 *   `}
 * `
 */
export const reduceMotion = (styles) => css`
  @media (prefers-reduced-motion: reduce) {
    ${typeof styles === 'function' ? styles : css`${styles}`}
  }
`

/**
 * Creates styles for high contrast preference
 * @param {string|Function} styles - CSS styles or function returning styles
 * @returns {Function} Styled-components CSS
 * @example
 * const Text = styled.p`
 *   ${highContrast`
 *     color: black;
 *     background: white;
 *   `}
 * `
 */
export const highContrast = (styles) => css`
  @media (prefers-contrast: high) {
    ${typeof styles === 'function' ? styles : css`${styles}`}
  }
`

/**
 * Creates gradient text styles
 * @param {string} gradient - CSS gradient value
 * @returns {Object} CSS properties for gradient text
 * @example
 * const GradientText = styled.h1`
 *   ${gradientText('linear-gradient(to right, #ff0000, #00ff00)')}
 * `
 */
export const gradientText = (gradient) => css`
  background: ${gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
`

/**
 * Creates glass morphism effect
 * @param {Object} options - Glass effect options
 * @returns {Object} CSS properties for glass effect
 * @example
 * const GlassCard = styled.div`
 *   ${glassEffect()}
 * `
 */
export const glassEffect = ({
  opacity = 0.2,
  blur = '10px',
  saturation = 180,
  brightness = 1.2
} = {}) => css`
  background: rgba(255, 255, 255, ${opacity});
  backdrop-filter: blur(${blur}) saturate(${saturation}%) brightness(${brightness});
  -webkit-backdrop-filter: blur(${blur}) saturate(${saturation}%) brightness(${brightness});
` 