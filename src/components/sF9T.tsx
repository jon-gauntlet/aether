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

const SpaceContainer = styled.div<{ depth: number }>`
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px ${p => `rgba(0, 0, 0, ${0.03 + p.depth * 0.07})`};
  transition: all 0.5s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

interface SpaceViewProps {
  spaceSystem: SpaceSystem;
  flow: Flow;
}

export const SpaceView: React.FC<SpaceViewProps> = ({ spaceSystem, flow }) => {
  const [spaces, setSpaces] = useState<Map<string, Space>>(new Map());
  
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
    flow.enterSpace('user', spaceId);
  };

  return (
    <Container>
      {Array.from(spaces.values()).map(space => (
        <SpaceContainer 
          key={space.id}
          depth={space.depth}
          onClick={() => handleEnterSpace(space.id)}
        >
          <StillnessOverlay stillness={space.stillness} />
          <SpaceTitle>
            {space.type.charAt(0).toUpperCase() + space.type.slice(1)}
          </SpaceTitle>
          <PresenceIndicator presence={space.presence} />
        </SpaceContainer>
      ))}
    </Container>
  );
}; 