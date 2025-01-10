import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PresenceControls } from './components/PresenceControls';
import { PresenceType } from './core/types/stream';
import { useFlow } from './core/hooks/useFlow';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  color: white;
  border: 1px solid red; /* Debug border */
`;

export const App: React.FC = () => {
  console.log('App rendering');
  const [presenceType, setPresenceType] = useState<PresenceType>('natural');
  const { stream, updatePresence } = useFlow('main');

  useEffect(() => {
    console.log('App useEffect - presenceType:', presenceType);
    console.log('App useEffect - stream:', stream);
    updatePresence(presenceType);
  }, [presenceType, updatePresence]);

  return (
    <Container>
      <h1>ChatGenius</h1>
      <PresenceControls
        currentType={presenceType}
        onTypeChange={setPresenceType}
        flowState={stream?.metrics}
      />
    </Container>
  );
};