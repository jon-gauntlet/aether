import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Container = styled.div.attrs(props => ({
  'data-active': props.isActive
}))`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.space.lg};
  background: ${props => props.$isActive ? 'rgba(0,123,255,0.05)' : 'transparent'};
  border-radius: 8px;
  transition: all 0.3s ease;
  transform: scale(${props => props.$scale});
  opacity: ${props => props.$opacity};
`

const EnergyLevel = styled.div`
  font-size: 24px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin: ${props => props.theme.space.md} 0;
`

const Status = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  opacity: 0.7;
`

const Field = ({
  energyLevel = 100,
  isActive = true,
  type = 'physical',
  onStateChange = () => {}
}) => {
  const scale = energyLevel / 100
  const opacity = Math.max(0.3, scale)

  const handleClick = () => {
    onStateChange(!isActive)
  }

  return (
    <Container
      $isActive={isActive}
      $scale={scale}
      $opacity={opacity}
      onClick={handleClick}
      data-testid="field-component"
    >
      <h3>{type} Field</h3>
      <EnergyLevel>{energyLevel}</EnergyLevel>
      <Status>
        {isActive ? 'Active' : 'Inactive'}
      </Status>
    </Container>
  )
}

Field.propTypes = {
  energyLevel: PropTypes.number,
  isActive: PropTypes.bool,
  type: PropTypes.string,
  onStateChange: PropTypes.func
}

export default Field 