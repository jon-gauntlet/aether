import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Space, SpaceType, SpaceSystem } from '../core/experience/space';
import { Flow, Stream, PresenceType } from '../core/experience/flow';

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: #fafafa;
  padding: 20px;
  gap: 20px;
`;

const SpaceContainer = styled.div<{ depth: number; active?: boolean }>`
  flex: 1;
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px ${p => `rgba(0, 0, 0, ${0.03 + p.depth * 0.07})`};
  transition: all 0.5s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  
  ${p => p.active && `
    flex: 2;
    background: #fcfcfc;
  `}
`;

const SpaceTitle = styled.h2`
  margin: 0;
  font-weight: 500;
  color: #333;
  font-size: 1.2em;
`;

const PresenceIndicator = styled.div<{ presence: number }>`
  height: 4px;
  background: ${p => `rgba(100, 100, 255, ${p.presence * 0.5})`};
  border-radius: 2px;
  transition: all 0.3s ease;
`;

const StillnessOverlay = styled.div<{ stillness: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${p => `rgba(255, 255, 255, ${p.stillness * 0.1})`};
  pointer-events: none;
  transition: all 0.5s ease;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
`;

const MessageArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Message = styled.div<{ depth: number }>`
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px ${p => `rgba(0, 0, 0, ${0.02 + p.depth * 0.03})`};
  transition: all 0.3s ease;
`;

const PresenceList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const PresenceBubble = styled.div<{ type: PresenceType }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9em;
  background: ${p => {
    switch (p.type) {
      case 'reading': return '#e3f2fd';
      case 'writing': return '#e8f5e9';
      case 'thinking': return '#f3e5f5';
      case 'listening': return '#fff3e0';
      default: return '#f5f5f5';
    }
  }};
  color: ${p => {
    switch (p.type) {
      case 'reading': return '#1565c0';
      case 'writing': return '#2e7d32';
      case 'thinking': return '#7b1fa2';
      case 'listening': return '#ef6c00';
      default: return '#616161';
    }
  }};
`;

interface SpaceViewProps {
  spaceSystem: SpaceSystem;
  flow: Flow;
}

// Simulate some other presences
const simulatedPresences = {
  'space-sanctuary': [
    { name: 'Anna', type: 'thinking' as PresenceType },
  ],
  'space-library': [
    { name: 'Michael', type: 'reading' as PresenceType },
    { name: 'Sarah', type: 'writing' as PresenceType },
  ],
  'space-garden': [
    { name: 'David', type: 'listening' as PresenceType },
    { name: 'Emma', type: 'thinking' as PresenceType },
  ],
  'space-workshop': [
    { name: 'James', type: 'writing' as PresenceType },
  ],
  'space-commons': [
    { name: 'Lisa', type: 'listening' as PresenceType },
    { name: 'Tom', type: 'reading' as PresenceType },
  ],
};

// Simulate some messages
const simulatedMessages = {
  'space-garden': [
    { text: "The garden's stillness helps maintain focus while staying connected", depth: 0.7 },
    { text: "Yes, it's like a monastery's cloister - a space of transition and gentle presence", depth: 0.8 },
  ],
  'space-library': [
    { text: "This clarity reminds me of early morning reading", depth: 0.6 },
    { text: "The quietness here supports deep understanding", depth: 0.9 },
  ],
  'space-sanctuary': [
    { text: "Finding such depth in digital space...", depth: 0.95 },
  ],
};

export const SpaceView: React.FC<SpaceViewProps> = ({ spaceSystem, flow }) => {
  const [spaces, setSpaces] = useState<Map<string, Space>>(new Map());
  const [activeSpace, setActiveSpace] = useState<string>();
  
  useEffect(() => {
    // Create initial spaces
    const spaceTypes: SpaceType[] = ['sanctuary', 'library', 'garden', 'workshop', 'commons'];
    spaceTypes.forEach(type => {
      const id = `space-${type}`;
      spaceSystem.createSpace(id, type);
      
      // Connect spaces naturally
      if (type !== 'sanctuary') {
        spaceSystem.connectSpaces(id, `space-garden`);
      }
    });

    // Observe all spaces
    const subs = spaceTypes.map(type => {
      const id = `space-${type}`;
      return spaceSystem.observe(id).subscribe(space => {
        if (space) {
          setSpaces(current => new Map(current.set(id, space)));
        }
      });
    });

    return () => subs.forEach(sub => sub.unsubscribe());
  }, [spaceSystem]);

  const handleEnterSpace = (spaceId: string) => {
    if (activeSpace === spaceId) {
      setActiveSpace(undefined);
      flow.leaveSpace('user');
    } else {
      setActiveSpace(spaceId);
      flow.enterSpace('user', spaceId);
    }
  };

  return (
    <Container>
      {Array.from(spaces.values()).map(space => (
        <SpaceContainer 
          key={space.id}
          depth={space.depth}
          active={activeSpace === space.id}
          onClick={() => handleEnterSpace(space.id)}
        >
          <StillnessOverlay stillness={space.stillness} />
          <SpaceTitle>
            {space.type.charAt(0).toUpperCase() + space.type.slice(1)}
          </SpaceTitle>
          <PresenceIndicator presence={space.presence} />
          
          {activeSpace === space.id && (
            <ContentArea>
              <PresenceList>
                {simulatedPresences[space.id]?.map(presence => (
                  <PresenceBubble key={presence.name} type={presence.type}>
                    {presence.name}
                  </PresenceBubble>
                ))}
              </PresenceList>
              
              <MessageArea>
                {simulatedMessages[space.id]?.map((msg, i) => (
                  <Message key={i} depth={msg.depth}>
                    {msg.text}
                  </Message>
                ))}
              </MessageArea>
            </ContentArea>
          )}
        </SpaceContainer>
      ))}
    </Container>
  );
}; 