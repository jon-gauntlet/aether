/**
 * @typedef {import('react').ButtonHTMLAttributes<HTMLButtonElement>} ButtonHTMLAttributes
 */

/**
 * @typedef {Object} StyledContainerProps
 * @property {string} [className] - CSS class name
 * @property {Object} [style] - Inline styles
 * @property {React.ReactNode} [children] - Child elements
 */

/**
 * @typedef {Object} StyledProps
 * @property {string} [theme] - Theme name
 * @property {boolean} [active] - Active state
 * @property {string} [variant] - Style variant
 */

/**
 * @typedef {Object} FlowProps
 * @property {string} [id] - Flow identifier
 * @property {boolean} [active] - Whether flow is active
 * @property {number} [depth] - Flow depth
 * @property {number} [intensity] - Flow intensity
 * @property {Function} [onStateChange] - Flow state change handler
 */

/**
 * @typedef {Object} ButtonProps
 * @property {string} [variant] - Button variant
 * @property {boolean} [disabled] - Whether button is disabled
 * @property {Function} [onClick] - Click handler
 * @property {React.ReactNode} [children] - Button content
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};