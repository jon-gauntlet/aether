import { render, screen } from '@testing-library/react'
import TeamListSkeleton from '../TeamListSkeleton'

describe('TeamListSkeleton', () => {
  test('renders correct number of skeleton team cards', () => {
    render(<TeamListSkeleton />)
    
    const skeletonCards = screen.getAllByTestId('team-skeleton-card')
    expect(skeletonCards).toHaveLength(3)
  })

  test('each skeleton card has required elements', () => {
    render(<TeamListSkeleton />)
    
    const skeletonCards = screen.getAllByTestId('team-skeleton-card')
    
    skeletonCards.forEach(card => {
      // Team name skeleton
      expect(card.querySelector('.w-1\\/3')).toBeInTheDocument()
      
      // Description skeletons
      const descriptionLines = card.querySelectorAll('.space-y-2 > div')
      expect(descriptionLines).toHaveLength(2)
      expect(descriptionLines[0]).toHaveClass('w-3/4')
      expect(descriptionLines[1]).toHaveClass('w-1/2')
      
      // Member count skeleton
      expect(card.querySelector('.w-24')).toBeInTheDocument()
      
      // Action buttons skeletons
      const actionButtons = card.querySelectorAll('.flex.space-x-2 > div')
      expect(actionButtons).toHaveLength(2)
      
      // Member avatars skeletons
      const avatars = card.querySelectorAll('.mt-4.flex.-space-x-2 > div')
      expect(avatars).toHaveLength(4)
    })
  })

  test('applies animation classes correctly', () => {
    render(<TeamListSkeleton />)
    
    const skeletonCards = screen.getAllByTestId('team-skeleton-card')
    
    skeletonCards.forEach(card => {
      expect(card).toHaveClass('animate-pulse')
      
      // Check background color classes
      const elements = card.querySelectorAll('.bg-gray-200')
      expect(elements.length).toBeGreaterThan(0)
      elements.forEach(element => {
        expect(element).toHaveClass('bg-gray-200')
      })
    })
  })

  test('maintains consistent spacing between cards', () => {
    render(<TeamListSkeleton />)
    
    const container = screen.getByTestId('skeleton-container')
    expect(container).toHaveClass('space-y-4')
  })

  test('renders member avatars with correct styling', () => {
    render(<TeamListSkeleton />)
    
    const avatars = screen.getAllByTestId('member-avatar-skeleton')
    
    avatars.forEach(avatar => {
      expect(avatar).toHaveClass('h-8', 'w-8', 'rounded-full', 'bg-gray-200', 'border-2', 'border-white')
    })
  })

  test('maintains responsive layout structure', () => {
    render(<TeamListSkeleton />)
    
    const cards = screen.getAllByTestId('team-skeleton-card')
    
    cards.forEach(card => {
      // Check flex layout
      expect(card.querySelector('.flex.items-start.justify-between')).toBeInTheDocument()
      
      // Check content structure
      const content = card.querySelector('.space-y-3.flex-1')
      expect(content).toBeInTheDocument()
      
      // Check action buttons container
      expect(card.querySelector('.flex.space-x-2')).toBeInTheDocument()
    })
  })
}) 