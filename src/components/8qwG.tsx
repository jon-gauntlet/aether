import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import styled from 'styled-components';
import { ThreadIcon, MentionIcon, DecisionIcon } from '../../components/icons';

interface ContextPoint {
  id: string;
  type: 'thread' | 'mention' | 'decision';
  content: string;
  timestamp: Date;
}

interface TimelineProps {
  points: ContextPoint[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const Timeline = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Point = styled(motion.div)<{ selected: boolean }>`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.selected ? 
    'rgba(255, 255, 255, 0.15)' : 
    'rgba(255, 255, 255, 0.05)'
  };
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Time = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9em;
`;

const Content = styled.div`
  color: rgba(255, 255, 255, 0.9);
`;

const Indicators = styled.div`
  display: flex;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
`;

export const ContextTimeline: React.FC<TimelineProps> = ({
  points,
  onSelect,
  selectedId
}) => {
  const [sortedPoints, setSortedPoints] = useState<ContextPoint[]>([]);

  useEffect(() => {
    setSortedPoints(
      [...points].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    );
  }, [points]);

  return (
    <Timeline>
      <AnimatePresence>
        {sortedPoints.map(point => (
          <Point
            key={point.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            selected={selectedId === point.id}
            onClick={() => onSelect(point.id)}
          >
            <Time>
              {format(point.timestamp, 'HH:mm')}
            </Time>
            
            <Content>
              {point.content}
            </Content>

            <Indicators>
              {point.type === 'thread' && <ThreadIcon />}
              {point.type === 'mention' && <MentionIcon />}
              {point.type === 'decision' && <DecisionIcon />}
            </Indicators>
          </Point>
        ))}
      </AnimatePresence>
    </Timeline>
  );
}; 