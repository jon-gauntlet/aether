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

const PatternGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.space.md};
  margin-top: ${props => props.theme.space.md};
`

const PatternItem = styled.div.attrs(props => ({
  'data-highlighted': props.isHighlighted
}))`
  padding: ${props => props.theme.space.sm};
  background: ${props => props.$isHighlighted ? 'rgba(0,123,255,0.1)' : props.theme.colors.background};
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0,123,255,0.15);
  }
`

const PatternLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  opacity: 0.7;
  margin-bottom: 4px;
`

const PatternValue = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`

const PatternVisualization = ({
  patterns = [],
  isActive = true,
  onPatternSelect = () => {}
}) => {
  const scale = isActive ? 1 : 0.9
  const opacity = isActive ? 1 : 0.7

  return (
    <Container
      $isActive={isActive}
      $scale={scale}
      $opacity={opacity}
      data-testid="pattern-visualization"
    >
      <h3>Pattern Analysis</h3>
      <PatternGrid>
        {patterns.map(pattern => (
          <PatternItem
            key={pattern.id}
            $isHighlighted={pattern.isHighlighted}
            onClick={() => onPatternSelect(pattern.id)}
          >
            <PatternLabel>{pattern.label}</PatternLabel>
            <PatternValue>{pattern.value}</PatternValue>
          </PatternItem>
        ))}
      </PatternGrid>
    </Container>
  )
}

PatternVisualization.propTypes = {
  patterns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isHighlighted: PropTypes.bool
    })
  ),
  isActive: PropTypes.bool,
  onPatternSelect: PropTypes.func
}

export default PatternVisualization 