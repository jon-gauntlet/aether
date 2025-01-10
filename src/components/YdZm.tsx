import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PresenceControls } from './components/PresenceControls';
import { Stream, PresenceType } from './core/types/stream';
import { FlowState } from './core/types/base';
import { useFlow } from './core/hooks/useFlow';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  color: white;
`;

export const App: React.FC = () => {
  const [presenceType, setPresenceType] = useState<PresenceType>('natural');
  const { stream, updatePresence } = useFlow('main');

  useEffect(() => {
    updatePresence(presenceType);
  }, [presenceType, updatePresence]);

  return (
    <Container>
      <PresenceControls
        currentType={presenceType}
        onTypeChange={setPresenceType}
        flowState={stream?.metrics}
      />
    </Container>
  );
};