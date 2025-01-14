import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  gap: ${props => props.theme.space.md};
  padding: ${props => props.theme.space.md};
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
`

const ModeButton = styled.button`
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  border: none;
  border-radius: 4px;
  background: ${props => props.$isSelected ? 'rgba(0, 123, 255, 0.2)' : 'transparent'};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not([data-selected="true"]) {
    background: rgba(0, 123, 255, 0.15);
  }
`

const FlowModeSelector = ({
  modes = ['Natural', 'Guided', 'Resonant'],
  currentMode = 'Natural',
  onSelect = () => {}
}) => {
  return (
    <Container>
      {modes.map(mode => (
        <ModeButton
          key={mode}
          $isSelected={mode === currentMode}
          data-selected={mode === currentMode}
          onClick={() => onSelect(mode)}
        >
          {mode}
        </ModeButton>
      ))}
    </Container>
  )
}

FlowModeSelector.propTypes = {
  modes: PropTypes.arrayOf(PropTypes.string),
  currentMode: PropTypes.string,
  onSelect: PropTypes.func
}

export default FlowModeSelector 