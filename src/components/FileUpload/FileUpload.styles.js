import styled from 'styled-components'
import { motion } from 'framer-motion'

export const Container = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

export const DropZone = styled(motion.div)`
  border: 2px dashed ${({ theme, error }) => 
    error ? theme.colors.error[500] :
    theme.colors.neutral[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 2rem;
  text-align: center;
  transition: all 0.2s ease;
  background: ${({ theme, isDragActive }) => 
    isDragActive ? theme.colors.primary[50] : 'transparent'};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.neutral[600]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`

export const FileList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

export const FileItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.neutral[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`

export const Button = styled(motion.button)`
  padding: 0.5rem 1rem;
  background: ${({ theme, variant }) => 
    variant === 'secondary' ? theme.colors.neutral[100] :
    variant === 'danger' ? theme.colors.error[500] :
    theme.colors.primary[500]};
  color: ${({ theme, variant }) => 
    variant === 'secondary' ? theme.colors.neutral[700] :
    'white'};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme, size }) => 
    size === 'small' ? theme.typography.fontSize.xs :
    theme.typography.fontSize.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme, variant }) => 
      variant === 'secondary' ? theme.colors.neutral[200] :
      variant === 'danger' ? theme.colors.error[600] :
      theme.colors.primary[600]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const Message = styled(motion.div)`
  padding: 0.75rem;
  background: ${({ theme, type }) => 
    type === 'error' ? theme.colors.error[50] :
    type === 'success' ? theme.colors.success[50] :
    theme.colors.neutral[50]};
  color: ${({ theme, type }) => 
    type === 'error' ? theme.colors.error[700] :
    type === 'success' ? theme.colors.success[700] :
    theme.colors.neutral[700]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border: 1px solid ${({ theme, type }) => 
    type === 'error' ? theme.colors.error[200] :
    type === 'success' ? theme.colors.success[200] :
    theme.colors.neutral[200]};
`

export const FilePreview = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const FileIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, type }) => {
    switch (type) {
      case 'image':
        return theme.colors.primary[50]
      case 'document':
        return theme.colors.success[50]
      case 'archive':
        return theme.colors.warning[50]
      default:
        return theme.colors.neutral[50]
    }
  }};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme, type }) => {
    switch (type) {
      case 'image':
        return theme.colors.primary[500]
      case 'document':
        return theme.colors.success[500]
      case 'archive':
        return theme.colors.warning[500]
      default:
        return theme.colors.neutral[500]
    }
  }};
`

export const FileDetails = styled.div`
  flex: 1;
  min-width: 0;

  span {
    display: block;
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    color: ${({ theme }) => theme.colors.neutral[900]};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    display: block;
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    color: ${({ theme }) => theme.colors.neutral[500]};
    margin-top: 0.25rem;
  }
`

export const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`

export const BatchActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`

export const FolderNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.neutral[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`

export const FolderPath = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral[600]};
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;

  span {
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.primary[500]};
    }
  }
`

export const SearchBar = styled.input`
  width: 100%;
  padding: 0.75rem;
  padding-left: 2.5rem;
  background: ${({ theme }) => theme.colors.neutral[50]};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral[900]};
  transition: all 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral[400]};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100]};
  }
`

export const ProgressIndicator = styled.div`
  width: ${({ size }) => size === 'small' ? '60px' : '100%'};
  height: 4px;
  background: ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${({ progress }) => `${progress}%`};
    height: 100%;
    background: ${({ theme }) => theme.colors.primary[500]};
    transition: width 0.2s ease;
  }
` 