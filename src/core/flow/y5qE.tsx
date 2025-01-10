import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FlowModeSelector } from './components/FlowModeSelector';
import { FlowStateIndicator } from './components/FlowStateIndicator';
import { useFlow } from './core/hooks/useFlow';
import { NaturalFlowType } from './core/types/base';

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
  const [mode, setMode] = useState<NaturalFlowType>('natural');
  const { stream, setMode: setEngineMode } = useFlow('main');

  useEffect(() => {
    setEngineMode(mode);
  }, [mode, setEngineMode]);

  return (
    <Container>
      <h1>Aether</h1>
      <FlowModeSelector
        currentMode={mode}
        onModeChange={setMode}
      />
      <FlowStateIndicator state={stream?.metrics} />
    </Container>
  );
};