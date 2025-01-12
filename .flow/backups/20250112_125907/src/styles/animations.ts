import { keyframes } from 'styled-components'

// Sacred geometry ratios
const PHI = 1.618033988749895
const PI = 3.141592653589793

export const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(${1 + 1/PHI}); }
  100% { transform: scale(1); }
`

export const breatheAnimation = keyframes`
  0% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(${1 + 1/(PHI*2)}); }
  100% { opacity: 0.8; transform: scale(1); }
`

export const flowAnimation = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-${10/PHI}px) rotate(${360/PHI}deg); }
  100% { transform: translateY(0) rotate(0deg); }
`

export const spiralAnimation = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(${180 + 360/PHI}deg) scale(${1 + 1/(PHI*3)}); }
  100% { transform: rotate(360deg) scale(1); }
`

// Animation timing constants based on divine proportions
export const timing = {
  fast: `${0.5 * PHI}s`,
  normal: `${1 * PHI}s`,
  slow: `${2 * PHI}s`,
  easings: {
    natural: 'cubic-bezier(0.618, 0, 0.382, 1)',
    smooth: 'cubic-bezier(0.382, 0, 0.618, 1)',
    gentle: 'cubic-bezier(0.236, 0, 0.764, 1)',
  }
} 