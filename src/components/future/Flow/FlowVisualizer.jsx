import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const FlowVisualizer = ({ metrics, confidence }) => {
  // Component implementation
};

FlowVisualizer.propTypes = {
  metrics: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired
  })).isRequired,
  confidence: PropTypes.number.isRequired
};

const MetricBar = styled.div`
  background-color: ${props => props.theme.colors.primary};
  width: ${props => props.value}%;
`;

const ConfidenceBadge = styled.div`
  background-color: ${props => props.confidence > 0.7 ? 'green' : 'orange'};
  opacity: ${props => props.confidence};
`;

export default FlowVisualizer; 