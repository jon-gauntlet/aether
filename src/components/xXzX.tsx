import React, { useState, useEffect } from 'react';
import { SpaceSystem } from './core/experience/space';
import { Flow, PresenceType, FlowState } from './core/experience/flow';
import { SpaceView } from './components/SpaceView';
import { PresenceControls } from './components/PresenceControls';
import styled from 'styled-components';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #fafafa;
`;

// Initialize our core systems
const spaceSystem = new SpaceSystem();
const flow = new Flow(spaceSystem);

function App() {
  const [presenceType, setPresenceType] = useState<PresenceType>();
  const [flowState, setFlowState] = useState<FlowState>('shallow');

  useEffect(() => {
    // Observe user's stream
    const sub = flow.observe('user').subscribe(stream => {
      if (stream) {
        setFlowState(stream.flowState);
      }
    });

    return () => sub.unsubscribe();
  }, []);

  const handlePresenceTypeChange = (type: PresenceType) => {
    setPresenceType(type);
    flow.notice('user', type);
  };

  return (
    <AppContainer>
      <SpaceView spaceSystem={spaceSystem} flow={flow} />
      <PresenceControls
        currentType={presenceType}
        flowState={flowState}
        onChangeType={handlePresenceTypeChange}
      />
    </AppContainer>
  );
}

export default App; 