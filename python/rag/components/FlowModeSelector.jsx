import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
`

const ModeButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  
  &.active {
    background: rgba(0, 123, 255, 0.2);
  }

  &:hover:not(.active) {
    background: rgba(0, 123, 255, 0.1);
  }
`

export const FlowModeSelector = ({ currentMode, onSelect }) => {
  const modes = ['Natural', 'Guided', 'Resonant']
  
  return (
    <Container>
      {modes.map(mode => (
        <ModeButton
          key={mode}
          className={currentMode === mode ? 'active' : ''}
          onClick={() => onSelect(mode)}
        >
          {mode}
        </ModeButton>
      ))}
    </Container>
  )
}

FlowModeSelector.propTypes = {
  currentMode: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired
}

FlowModeSelector.defaultProps = {
  currentMode: 'Natural'
}