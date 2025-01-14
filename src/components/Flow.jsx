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

const FlowMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.space.md};
  margin-top: ${props => props.theme.space.md};
`

const MetricCard = styled.div`
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.colors.background};
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
`

const MetricLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  opacity: 0.7;
  margin-bottom: 4px;
`

const MetricValue = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`

const Flow = ({
  metrics = [],
  isActive = true,
  onStateChange = () => {}
}) => {
  const scale = isActive ? 1 : 0.9
  const opacity = isActive ? 1 : 0.7

  const handleClick = () => {
    onStateChange(!isActive)
  }

  return (
    <Container
      $isActive={isActive}
      $scale={scale}
      $opacity={opacity}
      onClick={handleClick}
      data-testid="flow-component"
    >
      <h3>Flow State</h3>
      <FlowMetrics>
        {metrics.map(metric => (
          <MetricCard key={metric.label}>
            <MetricLabel>{metric.label}</MetricLabel>
            <MetricValue>{metric.value}</MetricValue>
          </MetricCard>
        ))}
      </FlowMetrics>
    </Container>
  )
}

Flow.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ),
  isActive: PropTypes.bool,
  onStateChange: PropTypes.func
}

export default Flow 