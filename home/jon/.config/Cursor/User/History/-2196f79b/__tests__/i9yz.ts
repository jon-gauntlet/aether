import { PresenceType, Stream } from '../stream';
import { FlowMetrics, Resonance } from '../base';

describe('Stream Types', () => {
  describe('PresenceType', () => {
    it('should accept valid presence types', () => {
      const validTypes: PresenceType[] = ['natural', 'guided', 'resonant'];
      validTypes.forEach(type => {
        expect(type).toBeDefined();
      });
    });

    it('should be used in type-safe contexts', () => {
      const updatePresence = (type: PresenceType) => type;
      expect(updatePresence('natural')).toBe('natural');
      expect(updatePresence('guided')).toBe('guided');
      expect(updatePresence('resonant')).toBe('resonant');
    });
  });

  describe('Stream', () => {
    const mockMetrics: FlowMetrics = {
      depth: 0.8,
      harmony: 0.8,
      energy: 0.8,
      presence: 0.8,
      resonance: 0.8,
      coherence: 0.8,
      rhythm: 0.8,
    };

    const mockResonance: Resonance = {
      strength: 0.8,
      harmony: 0.8,
      depth: 0.8,
    };

    it('should create valid stream objects', () => {
      const stream: Stream = {
        id: 'test-stream',
        type: 'natural',
        metrics: mockMetrics,
        resonance: mockResonance,
        timestamp: Date.now(),
      };

      expect(stream.id).toBe('test-stream');
      expect(stream.type).toBe('natural');
      expect(stream.metrics).toEqual(mockMetrics);
      expect(stream.resonance).toEqual(mockResonance);
      expect(stream.timestamp).toBeDefined();
    });

    it('should validate required properties', () => {
      const stream: Stream = {
        id: 'test-stream',
        type: 'guided',
        metrics: mockMetrics,
        resonance: mockResonance,
        timestamp: Date.now(),
      };

      expect(stream.id).toBe('test-stream');
      expect(stream.type).toBe('guided');
      expect(stream.metrics).toBeDefined();
      expect(stream.resonance).toBeDefined();
      expect(stream.timestamp).toBeDefined();
    });
  });
}); 