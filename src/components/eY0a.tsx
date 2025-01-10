import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
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
    <div className="context-timeline">
      <AnimatePresence>
        {sortedPoints.map(point => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`context-point ${selectedId === point.id ? 'selected' : ''}`}
            onClick={() => onSelect(point.id)}
          >
            <div className="context-time">
              {format(point.timestamp, 'HH:mm')}
            </div>
            
            <div className="context-content">
              {point.content}
            </div>

            <div className="context-indicators">
              {point.type === 'thread' && <ThreadIcon />}
              {point.type === 'mention' && <MentionIcon />}
              {point.type === 'decision' && <DecisionIcon />}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <style jsx>{`
        .context-timeline {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .context-point {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .context-point:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .context-point.selected {
          background: rgba(255, 255, 255, 0.15);
        }

        .context-time {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9em;
        }

        .context-content {
          color: rgba(255, 255, 255, 0.9);
        }

        .context-indicators {
          display: flex;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
}; 