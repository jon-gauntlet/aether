import React from 'react'
import { Skeleton } from '../Skeleton'
import { useLoadingTransition } from '../../utils/stateTransitions'
import { TransitionFade } from '../../utils/stateTransitions'
import { useTheme } from '../../contexts/ThemeContext'

// Profile Card Loading Example
export const ProfileCardSkeleton = () => {
  const { isDark } = useTheme()
  
  return (
    <Skeleton.Container>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Skeleton.Avatar size="4rem" isDark={isDark} />
        <div style={{ flex: 1 }}>
          <Skeleton.Text height="1.5rem" width="60%" isDark={isDark} />
          <Skeleton.Text height="1rem" width="40%" isDark={isDark} />
        </div>
      </div>
      <Skeleton.Text lines={3} isDark={isDark} />
      <Skeleton.Button width="100%" isDark={isDark} />
    </Skeleton.Container>
  )
}

// Content Grid Loading Example
export const ContentGridSkeleton = () => {
  const { isDark } = useTheme()
  
  return (
    <Skeleton.Container>
      <Skeleton.Text height="2rem" width="50%" isDark={isDark} />
      <Skeleton.Grid 
        columns={3} 
        rows={2} 
        itemHeight="12rem"
        isDark={isDark}
      />
    </Skeleton.Container>
  )
}

// Table Loading Example
export const TableSkeleton = () => {
  const { isDark } = useTheme()
  
  return (
    <Skeleton.Container>
      <Skeleton.Text height="2rem" width="30%" isDark={isDark} />
      <Skeleton.Table 
        rows={5} 
        columns={4}
        isDark={isDark}
      />
    </Skeleton.Container>
  )
}

// Example of a component using loading transition
export const LoadingExample = ({ children, onLoad }) => {
  const { isLoading, startLoading, stopLoading } = useLoadingTransition({
    minLoadingTime: 1000
  })
  const { isDark } = useTheme()

  React.useEffect(() => {
    const loadData = async () => {
      startLoading()
      try {
        await onLoad?.()
      } finally {
        stopLoading()
      }
    }

    loadData()
  }, [onLoad, startLoading, stopLoading])

  return (
    <TransitionFade>
      {isLoading ? (
        <Skeleton.Container>
          <Skeleton.Text lines={3} isDark={isDark} />
          <Skeleton.Image isDark={isDark} />
          <Skeleton.Button isDark={isDark} />
        </Skeleton.Container>
      ) : (
        children
      )}
    </TransitionFade>
  )
}

// List Loading Example
export const ListSkeleton = () => {
  const { isDark } = useTheme()
  
  return (
    <Skeleton.Container>
      <Skeleton.Text height="2rem" width="40%" isDark={isDark} />
      <Skeleton.List 
        items={5}
        itemHeight="4rem"
        gap="1rem"
        isDark={isDark}
      />
    </Skeleton.Container>
  )
}

// Form Loading Example
export const FormSkeleton = () => {
  const { isDark } = useTheme()
  
  return (
    <Skeleton.Container>
      <Skeleton.Text height="2rem" width="50%" isDark={isDark} />
      <div style={{ display: 'grid', gap: '1rem' }}>
        <Skeleton.Text height="2.5rem" isDark={isDark} />
        <Skeleton.Text height="2.5rem" isDark={isDark} />
        <Skeleton.Text height="6rem" isDark={isDark} />
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Skeleton.Button width="6rem" isDark={isDark} />
          <Skeleton.Button width="6rem" isDark={isDark} />
        </div>
      </div>
    </Skeleton.Container>
  )
}

// Dashboard Loading Example
export const DashboardSkeleton = () => {
  const { isDark } = useTheme()
  
  return (
    <Skeleton.Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton.Text height="2rem" width="30%" isDark={isDark} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Skeleton.Button width="6rem" isDark={isDark} />
          <Skeleton.Button width="6rem" isDark={isDark} />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <Skeleton.Card height="8rem" isDark={isDark} />
        <Skeleton.Card height="8rem" isDark={isDark} />
        <Skeleton.Card height="8rem" isDark={isDark} />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <Skeleton.Card height="20rem" isDark={isDark} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton.Card height="9.5rem" isDark={isDark} />
          <Skeleton.Card height="9.5rem" isDark={isDark} />
        </div>
      </div>
    </Skeleton.Container>
  )
} 