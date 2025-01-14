import React from 'react';
import styled from 'styled-components';
import { useSpaces } from '../../core/spaces/SpaceProvider';

const SpaceListContainer = styled.div`
  width: 240px;
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.space.md};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  height: 100%;
`;

const SpaceSection = styled.div`
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const SpaceHeader = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textAlt};
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
`;

const SpaceItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  color: ${({ isActive, theme }) => isActive ? theme.colors.primary : theme.colors.text};
  background: ${({ isActive, theme }) => isActive ? `${theme.colors.primary}11` : 'transparent'};

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}22`};
  }
`;

const SpaceIcon = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: ${({ theme }) => theme.space.sm};
  background: ${({ energy, theme }) => {
    if (energy > 0.7) return theme.colors.success;
    if (energy > 0.3) return theme.colors.warning;
    return theme.colors.error;
  }};
`;

const SpaceName = styled.span`
  flex: 1;
`;

const PresenceIndicator = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textAlt};
`;

export function SpaceList() {
  const { spaces, currentSpace, switchSpace } = useSpaces();
  
  const spaceGroups = {
    focus: ['Sanctuary'],
    creation: ['Workshop', 'Garden'],
    community: ['Commons', 'Library'],
    restoration: ['Recovery']
  };

  const renderSpaceGroup = (title, spaceNames) => (
    <SpaceSection key={title}>
      <SpaceHeader>{title}</SpaceHeader>
      {spaceNames.map(name => {
        const space = spaces.find(s => s.type === name);
        return (
          <SpaceItem
            key={name}
            isActive={currentSpace?.type === name}
            onClick={() => switchSpace(name)}
          >
            <SpaceIcon energy={space?.energy || 0} />
            <SpaceName>{name}</SpaceName>
            <PresenceIndicator>
              {space?.presence?.length || 0}
            </PresenceIndicator>
          </SpaceItem>
        );
      })}
    </SpaceSection>
  );

  return (
    <SpaceListContainer>
      {renderSpaceGroup('Focus', spaceGroups.focus)}
      {renderSpaceGroup('Creation', spaceGroups.creation)}
      {renderSpaceGroup('Community', spaceGroups.community)}
      {renderSpaceGroup('Restoration', spaceGroups.restoration)}
    </SpaceListContainer>
  );
} 