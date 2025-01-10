import React from 'react';
import styled from 'styled-components';
import { Stream } from '../../core/types/stream';

const Space = styled.div<{ depth: number }>`
  position: relative;
  width: 100%;
  height: 100%;
  background: ${props => `rgba(0, 0, 0, ${0.9 - props.depth * 0.5})`};
  transition: background 0.3s ease;
`;

const Still = styled.div<{ stillness: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${props => `rgba(255, 255, 255, ${props.stillness * 0.1})`};
  transition: background 0.3s ease;
`;

const Content = styled.div<{ presence: number; clarity: number }>`
  position: relative;
  padding: 2rem;
  color: ${props => `rgba(255, 255, 255, ${0.5 + props.presence * 0.5})`};
  opacity: ${props => 0.5 + props.clarity * 0.5};
  transition: all 0.3s ease;
`;

interface Props {
  stream?: Stream;
  children?: React.ReactNode;
}

export const Presence: React.FC<Props> = ({ stream, children }) => {
  if (!stream) return null;

  const metrics = stream.metrics;
  const resonance = stream.resonance;

  return (
    <Space depth={metrics.depth}>
      <Still stillness={resonance.essence} />
      <Content 
        presence={metrics.presence} 
        clarity={resonance.harmony}
      >
        {children}
      </Content>
    </Space>
  );
};