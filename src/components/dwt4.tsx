import React from 'react';
import { SpaceSystem } from './core/experience/space';
import { Flow } from './core/experience/flow';
import { SpaceView } from './components/SpaceView';
import styled from 'styled-components';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #fafafa;
`;

// Initialize our core systems
const spaceSystem = new SpaceSystem();
const flow = new Flow(spaceSystem);

function App() {
  return (
    <AppContainer>
      <SpaceView spaceSystem={spaceSystem} flow={flow} />
    </AppContainer>
  );
}

export default App; 