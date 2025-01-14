import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const SpaceContainer = styled.div`
  padding: 1rem;
  border-radius: 8px;
  background: ${props => props.isActive ? props.theme.colors.spaceActive : props.theme.colors.spaceBg};
  transition: background 0.3s ease;
`

const SpaceTitle = styled.h3`
  margin: 0 0 0.5rem;
  color: ${props => props.theme.colors.text};
`

const SpaceMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`

const MetricItem = styled.div`
  padding: 0.5rem;
  border-radius: 4px;
  background: ${props => props.theme.colors.metricBg};
`

/**
 * Space component for displaying a workspace area
 */
function Space({ 
  id,
  name,
  metrics = [],
  isActive = false,
  onActivate
}) {
  return (
    <SpaceContainer 
      isActive={isActive}
      onClick={() => onActivate(id)}
      data-testid="space"
    >
      <SpaceTitle>{name}</SpaceTitle>
      <SpaceMetrics>
        {metrics.map(metric => (
          <MetricItem key={metric.id}>
            <div>{metric.label}</div>
            <div>{metric.value}</div>
          </MetricItem>
        ))}
      </SpaceMetrics>
    </SpaceContainer>
  )
}

Space.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  metrics: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired, 
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]).isRequired
  })),
  isActive: PropTypes.bool,
  onActivate: PropTypes.func.isRequired
}

export default Space 