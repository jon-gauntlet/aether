import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Container = styled.div.attrs(props => ({
  'data-coherent': props.isCoherent
}))`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: ${props => props.$isCoherent ? 'rgba(0,0,0,0.05)' : 'transparent'};
  border-radius: 8px;
  transition: all 0.3s ease;
  transform: scale(${props => props.$scale});
  opacity: ${props => props.$opacity};
`

const EnergyLevel = styled.div`
  font-size: 24px;
  font-weight: 500;
  color: #333;
  margin: 16px 0;
`

const Status = styled.div`
  font-size: 14px;
  color: #666;
`

const Consciousness = ({ 
  awarenessLevel = 100,
  isCoherent = true,
  onStateChange = () => {}
}) => {
  const scale = awarenessLevel / 100
  const opacity = Math.max(0.3, scale)

  const handleClick = () => {
    onStateChange(!isCoherent)
  }

  return (
    <Container 
      $isCoherent={isCoherent}
      $scale={scale}
      $opacity={opacity}
      onClick={handleClick}
      data-testid="consciousness-component"
    >
      <h3>Consciousness</h3>
      <EnergyLevel>{awarenessLevel}</EnergyLevel>
      <Status>
        {isCoherent ? 'Coherent' : 'Incoherent'}
      </Status>
    </Container>
  )
}

Consciousness.propTypes = {
  awarenessLevel: PropTypes.number,
  isCoherent: PropTypes.bool,
  onStateChange: PropTypes.func
}

export default Consciousness 