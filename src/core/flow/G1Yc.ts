import { useState, useEffect, useCallback } from 'react';
import { Flow, Stream, PresenceType } from '../experience/flow';

// Singleton instance
const flow = new Flow();

export function useFlow() {
  const [stream, setStream] = useState<Stream>();
  const [otherStreams, setOtherStreams] = useState<Stream[]>([]);

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      const currentStream = flow.getStream('user');
      const others = flow.getOtherStreams('user');
      
      setStream(currentStream);
      setOtherStreams(others);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updatePresence = useCallback((presenceType: PresenceType) => {
    flow.updatePresence('user', presenceType);
  }, []);

  return {
    stream,
    otherStreams,
    updatePresence
  };
} 