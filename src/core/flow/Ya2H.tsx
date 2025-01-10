import React, { useEffect, useState } from 'react';
import { useFlow } from '../../core/hooks/useFlow';
import { Stream } from '../../core/types/consciousness';
import styled from 'styled-components';

const Space = styled.div<{ depth: number }>`
  position: relative;
  padding: 2rem;
  background: ${p => `rgba(255, 255, 255, ${0.95 - p.depth * 0.1})`};
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px ${p => `rgba(0, 0, 0, ${0.05 + p.depth * 0.05})`};
`;

const Still = styled.div<{ stillness: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: ${p => `rgba(255, 255, 255, ${p.stillness * 0.2})`};
  transition: all 0.5s ease;
`;

const Content = styled.div<{ presence: number }>`
  position: relative;
  opacity: ${p => 0.3 + p.presence * 0.7};
  transition: all 0.3s ease;
`;

const Resonance = styled.div<{ resonance: number }>`
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border-radius: 16px;
  border: 2px solid ${p => `rgba(100, 100, 255, ${p.resonance * 0.2})`};
  pointer-events: none;
  transition: all 0.5s ease;
`;

interface PresenceProps {
  id: string;
  children: React.ReactNode;
}

export const Presence: React.FC<PresenceProps> = ({ id, children }) => {
  const flow = useFlow();
  const [stream, setStream] = useState<Stream>();

  useEffect(() => {
    const sub = flow.observe(id).subscribe(s => {
      if (s) setStream(s);
    });
    return () => sub.unsubscribe();
  }, [id, flow]);

  if (!stream) return null;

  return (
    <Space depth={stream.depth}>
      <Still stillness={stream.stillness} />
      <Resonance resonance={stream.resonance} />
      <Content presence={stream.presence}>
        {children}
      </Content>
    </Space>
  );
};

// Natural interaction handlers
interface InteractionProps {
  id: string;
  onPresence?: (presence: number) => void;
  onStillness?: (stillness: number) => void;
  children: React.ReactNode;
}

export const Interaction: React.FC<InteractionProps> = ({
  id,
  onPresence,
  onStillness,
  children
}) => {
  const flow = useFlow();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active) {
      const interval = setInterval(() => {
        flow.notice(id);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [active, id, flow]);

  return (
    <div
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      style={{ cursor: 'default' }}
    >
      {children}
    </div>
  );
}; 