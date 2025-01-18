import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Flow = ({ flowIntensity, isInFlow, naturalResonance }) => {
  // Component implementation
};

Flow.propTypes = {
  flowIntensity: PropTypes.number,
  isInFlow: PropTypes.bool,
  naturalResonance: PropTypes.number
};

Flow.defaultProps = {
  flowIntensity: 0,
  isInFlow: false,
  naturalResonance: 0
};

const FlowContainer = styled.div`
  opacity: ${props => props.isActive ? 1 : 0.5};
`;

const FlowIndicator = styled.div`
  transform: scale(${props => 1 + (props.intensity || 0) * 0.2});
  filter: hue-rotate(${props => (props.resonance || 0) * 360}deg);
`;

export default Flow; 