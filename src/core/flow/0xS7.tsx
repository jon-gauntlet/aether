import React from 'react';
import styled from 'styled-components';
import { useFlow } from '../core/hooks/useFlow';
import { FlowPresence } from './flow/FlowPresence';
import { FlowHarmony } from './flow/FlowHarmony';
import { FlowDiscovery } from './flow/FlowDiscovery';

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

const SpaceView: React.FC = () => {
  const flow = useFlow();

  return (
    <Container>
      <FlowPresence>
        <FlowHarmony>
          <FlowDiscovery />
        </FlowHarmony>
      </FlowPresence>
    </Container>
  );
};

export default SpaceView; 