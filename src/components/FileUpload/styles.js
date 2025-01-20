import styled from 'styled-components'
import { motion } from 'framer-motion'
import { UPLOAD_STATES } from '../../config/constants'

export const DropZone = styled(motion.div)`
  border: 2px dashed ${({ theme, isDragActive }) => 
    isDragActive ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 2rem;
  text-align: center;
  background: ${({ theme, isDragActive }) => 
    isDragActive ? theme.colors.primaryLight : theme.colors.background};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primaryLight};
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
  }

  small {
    color: ${({ theme }) => theme.colors.textLight};
  }
`

export const FileList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
`

export const FileItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: ${({ theme, variant }) => {
    switch (variant) {
      case UPLOAD_STATES.SUCCESS:
        return theme.colors.successLight
      case UPLOAD_STATES.ERROR:
        return theme.colors.errorLight
      default:
        return theme.colors.surface
    }
  }};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme, variant }) => {
    switch (variant) {
      case UPLOAD_STATES.SUCCESS:
        return theme.colors.success
      case UPLOAD_STATES.ERROR:
        return theme.colors.error
      default:
        return theme.colors.border
    }
  }};

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
  }

  small {
    color: ${({ theme }) => theme.colors.textLight};
  }

  button {
    margin-left: auto;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: ${({ theme }) => theme.radii.sm};
    background: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.white};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: ${({ theme }) => theme.colors.errorDark};
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`

export const Message = styled(motion.div)`
  padding: 0.75rem;
  margin: 1rem 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, variant }) => {
    switch (variant) {
      case 'success':
        return theme.colors.successLight
      case 'error':
        return theme.colors.errorLight
      default:
        return theme.colors.surface
    }
  }};
  border: 1px solid ${({ theme, variant }) => {
    switch (variant) {
      case 'success':
        return theme.colors.success
      case 'error':
        return theme.colors.error
      default:
        return theme.colors.border
    }
  }};
  color: ${({ theme, variant }) => {
    switch (variant) {
      case 'success':
        return theme.colors.success
      case 'error':
        return theme.colors.error
      default:
        return theme.colors.text
    }
  }};
`

export const FilePreview = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, type }) => {
    if (type.startsWith('image/')) {
      return theme.colors.primary
    }
    if (type === 'application/pdf') {
      return theme.colors.error
    }
    if (type.includes('word')) {
      return theme.colors.info
    }
    return theme.colors.secondary
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white};
  font-size: 1.5rem;
`

export const BatchActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: ${({ theme }) => theme.colors.primaryDark};
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:last-child {
      background: ${({ theme }) => theme.colors.surface};
      color: ${({ theme }) => theme.colors.text};
      border: 1px solid ${({ theme }) => theme.colors.border};

      &:hover {
        background: ${({ theme }) => theme.colors.surfaceDark};
      }
    }
  }
`

export const ProgressIndicator = styled.progress`
  width: 100%;
  height: 4px;
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
  
  &::-webkit-progress-bar {
    background: ${({ theme }) => theme.colors.surface};
  }
  
  &::-webkit-progress-value {
    background: ${({ theme }) => theme.colors.primary};
    transition: width 0.2s ease;
  }
  
  &::-moz-progress-bar {
    background: ${({ theme }) => theme.colors.primary};
    transition: width 0.2s ease;
  }
` 