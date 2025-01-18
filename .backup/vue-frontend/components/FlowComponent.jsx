import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const FlowComponent = ({ isInFlow, value }) => {
  // Component implementation
};

FlowComponent.propTypes = {
  isInFlow: PropTypes.bool.isRequired,
  value: PropTypes.number.isRequired
};

const Metric = styled.div`
  background-color: ${props => props.value > 50 ? 'green' : 'red'};
`;

export default FlowComponent; 