import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SpaceView from './components/SpaceView';
import PresenceControls from './components/PresenceControls';
import { PresenceType } from './core/experience/flow';
import { useFlow } from './core/hooks/useFlow';

const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e6e6e6;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
`;

const App: React.FC = () => {
  const [presenceType, setPresenceType] = useState<PresenceType>('reading');
  const { stream, updatePresence } = useFlow();

  useEffect(() => {
    updatePresence(presenceType);
  }, [presenceType, updatePresence]);

  return (
    <AppContainer>
      <ContentArea>
        <SpaceView />
      </ContentArea>
      <PresenceControls 
        presenceType={presenceType}
        onPresenceTypeChange={setPresenceType}
        flowState={stream?.flowState || 'shallow'}
      />
    </AppContainer>
  );
};

export default App; 