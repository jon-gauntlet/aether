import React from 'react'
import { motion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import PropTypes from 'prop-types'

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`

const Base = styled.div`
  background: ${props => props.$isDark ? '#374151' : '#E5E7EB'};
  border-radius: ${props => props.$radius || '0.375rem'};
  position: relative;
  overflow: hidden;
  
  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0,
      ${props => props.$isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)'} 20%,
      ${props => props.$isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'} 60%,
      rgba(255, 255, 255, 0)
    );
    animation: ${shimmer} 2s infinite;
    content: '';
  }
`

const Container = styled(motion.div)`
  display: flex;
  flex-direction: ${props => props.$direction || 'column'};
  gap: ${props => props.$gap || '1rem'};
`

export const Skeleton = {
  Container: ({ 
    children, 
    direction = 'column',
    gap = '1rem',
    ...props 
  }) => (
    <Container
      $direction={direction}
      $gap={gap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      {...props}
    >
      {children}
    </Container>
  ),

  Text: ({ 
    lines = 1,
    width = '100%',
    height = '1rem',
    spacing = '0.5rem',
    lastLineWidth = '75%',
    isDark = false,
    ...props
  }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Base
          key={i}
          style={{
            width: i === lines - 1 && lines > 1 ? lastLineWidth : width,
            height
          }}
          $isDark={isDark}
          {...props}
        />
      ))}
    </div>
  ),

  Avatar: ({
    size = '3rem',
    isDark = false,
    ...props
  }) => (
    <Base
      style={{
        width: size,
        height: size,
        borderRadius: '50%'
      }}
      $isDark={isDark}
      {...props}
    />
  ),

  Image: ({
    width = '100%',
    height = '200px',
    isDark = false,
    ...props
  }) => (
    <Base
      style={{ width, height }}
      $isDark={isDark}
      {...props}
    />
  ),

  Button: ({
    width = '8rem',
    height = '2.5rem',
    isDark = false,
    ...props
  }) => (
    <Base
      style={{ width, height }}
      $isDark={isDark}
      {...props}
    />
  ),

  Card: ({
    width = '100%',
    height = '12rem',
    isDark = false,
    ...props
  }) => (
    <Base
      style={{ width, height }}
      $isDark={isDark}
      {...props}
    />
  ),

  List: ({
    items = 3,
    itemHeight = '3rem',
    gap = '0.5rem',
    isDark = false,
    ...props
  }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: items }).map((_, i) => (
        <Base
          key={i}
          style={{ height: itemHeight }}
          $isDark={isDark}
          {...props}
        />
      ))}
    </div>
  ),

  Grid: ({
    columns = 3,
    rows = 2,
    itemWidth = '100%',
    itemHeight = '8rem',
    gap = '1rem',
    isDark = false,
    ...props
  }) => (
    <div 
      style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap
      }}
    >
      {Array.from({ length: columns * rows }).map((_, i) => (
        <Base
          key={i}
          style={{ width: itemWidth, height: itemHeight }}
          $isDark={isDark}
          {...props}
        />
      ))}
    </div>
  ),

  Table: ({
    rows = 5,
    columns = 4,
    headerHeight = '3rem',
    rowHeight = '2.5rem',
    isDark = false,
    ...props
  }) => (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Base
            key={i}
            style={{ height: headerHeight }}
            $isDark={isDark}
            {...props}
          />
        ))}
      </div>
      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: '1rem'
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Base
                key={colIndex}
                style={{ height: rowHeight }}
                $isDark={isDark}
                {...props}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

Skeleton.Container.propTypes = {
  children: PropTypes.node,
  direction: PropTypes.oneOf(['row', 'column']),
  gap: PropTypes.string
}

Skeleton.Text.propTypes = {
  lines: PropTypes.number,
  width: PropTypes.string,
  height: PropTypes.string,
  spacing: PropTypes.string,
  lastLineWidth: PropTypes.string,
  isDark: PropTypes.bool
}

Skeleton.Avatar.propTypes = {
  size: PropTypes.string,
  isDark: PropTypes.bool
}

Skeleton.Image.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  isDark: PropTypes.bool
}

Skeleton.Button.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  isDark: PropTypes.bool
}

Skeleton.Card.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  isDark: PropTypes.bool
}

Skeleton.List.propTypes = {
  items: PropTypes.number,
  itemHeight: PropTypes.string,
  gap: PropTypes.string,
  isDark: PropTypes.bool
}

Skeleton.Grid.propTypes = {
  columns: PropTypes.number,
  rows: PropTypes.number,
  itemWidth: PropTypes.string,
  itemHeight: PropTypes.string,
  gap: PropTypes.string,
  isDark: PropTypes.bool
}

Skeleton.Table.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  headerHeight: PropTypes.string,
  rowHeight: PropTypes.string,
  isDark: PropTypes.bool
} 