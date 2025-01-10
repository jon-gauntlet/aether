import React from 'react';
import styled from 'styled-components';
import { useFlow } from '../core/hooks/useFlow';

const Container = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
`;

const PresenceBubble = styled.div<{ depth: number }>`
  padding: 12px 16px;
  background: ${props => `rgba(255, 255, 255, ${0.03 + props.depth * 0.02})`};
  border-radius: 8px;
  margin: 4px 0;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const SpaceView: React.FC = () => {
  const { stream, otherStreams } = useFlow();
  
  return (
    <Container>
      <ContentArea>
        {otherStreams?.map((otherStream, index) => (
          <PresenceBubble 
            key={index}
            depth={otherStream.depth || 0}
          >
            {otherStream.presenceType} - {otherStream.flowState}
          </PresenceBubble>
        ))}
      </ContentArea>
    </Container>
  );
};

export default SpaceView; 