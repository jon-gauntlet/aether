import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  gap: ${props => props.theme.space.md}px;
  padding: ${props => props.theme.space.md}px;
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
`

const ModeButton = styled.button`
  padding: ${props => props.theme.space.sm}px ${props => props.theme.space.md}px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &.active {
    background: rgba(0, 0, 0, 0.1);
  }
`

const FlowModeSelector = ({ modes, currentMode, onModeChange }) => {
  return (
    <Container data-testid="flow-mode-selector">
      {modes.map(mode => (
        <ModeButton
          key={mode}
          onClick={() => onModeChange(mode)}
          className={mode === currentMode ? 'active' : ''}
        >
          {mode}
        </ModeButton>
      ))}
    </Container>
  )
}

FlowModeSelector.propTypes = {
  modes: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentMode: PropTypes.string.isRequired,
  onModeChange: PropTypes.func.isRequired
}

export default FlowModeSelector 