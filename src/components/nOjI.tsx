import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface ContextPoint {
  id: string;
  timestamp: Date;
  type: 'message' | 'thread' | 'mention' | 'task' | 'decision';
  summary: string;
  depth: number; // Focus depth when this happened
  energy: number; // User's energy level
  screenshot?: string; // Optional visual context
}

interface TimelineProps {
  channelId: string;
  onContextRestore: (point: ContextPoint) => void;
}

export const ContextTimeline: React.FC<TimelineProps> = ({ channelId, onContextRestore }) => {
  const [contextPoints, setContextPoints] = useState<ContextPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  // Visual representation of context depth
  const getDepthColor = (depth: number) => {
    const colors = ['#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B', '#475569'];
    return colors[Math.min(depth, colors.length - 1)];
  };

  // Animate based on energy levels
  const getEnergyAnimation = (energy: number) => ({
    scale: 1 + (energy * 0.1),
    transition: { duration: 0.3 }
  });

  return (
    <div className="context-timeline">
      <h3>Where Was I?</h3>
      
      <AnimatePresence>
        {contextPoints.map((point) => (
          <motion.div
            key={point.id}
            className="context-point"
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              backgroundColor: getDepthColor(point.depth),
              ...getEnergyAnimation(point.energy)
            }}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setSelectedPoint(point.id);
              onContextRestore(point);
            }}
          >
            <div className="time-marker">
              {format(point.timestamp, 'HH:mm')}
            </div>
            
            <div className="context-summary">
              {point.summary}
            </div>

            {point.screenshot && (
              <motion.img 
                src={point.screenshot}
                className="context-screenshot"
                layoutId={`screenshot-${point.id}`}
              />
            )}

            <div className="context-indicators">
              {point.type === 'thread' && <ThreadIcon />}
              {point.type === 'mention' && <MentionIcon />}
              {point.type === 'decision' && <DecisionIcon />}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}; 