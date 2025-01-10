import React from 'react';
import styled from '@emotion/styled';
import { Stream } from '../../core/types/stream';
import { Resonance as ResonanceType } from '../../core/types/base';

const Space = styled.div<{ depth: number }>`
  position: relative;
  width: 100%;
  height: ${props => Math.max(50, props.depth * 100)}px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin-bottom: 16px;
`;

const Still = styled.div<{ stillness: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${props => props.stillness * 100}%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
`;

const Content = styled.div<{ presence: number; clarity: number }>`
  position: relative;
  padding: 16px;
  opacity: ${props => props.presence};
  filter: blur(${props => (1 - props.clarity) * 4}px);
`;

const ResonanceIndicator = styled.div<{ value: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: ${props => props.value * 100}%;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 4px 4px 0;
`;

interface PresenceProps {
  stream: Stream;
  children?: React.ReactNode;
}

export const Presence: React.FC<PresenceProps> = ({ stream, children }) => {
  const resonanceValue = typeof stream.resonance === 'object' ? stream.resonance.harmony : 0;

  return (
    <Space depth={stream.depth || 0}>
      <Still stillness={stream.stillness || 0} />
      <ResonanceIndicator value={resonanceValue} />
      <Content presence={stream.presence || 0} clarity={stream.clarity || 0}>
        {children}
      </Content>
    </Space>
  );
};