import { PresenceType, Stream } from '../stream';

describe('Stream Types', () => {
  describe('PresenceType', () => {
    it('should accept valid presence types', () => {
      const validTypes: PresenceType[] = ['focused', 'active', 'idle'];
      validTypes.forEach(type => {
        expect(type).toBeDefined();
      });
    });

    it('should be used in type-safe contexts', () => {
      const updatePresence = (type: PresenceType) => type;
      expect(updatePresence('focused')).toBe('focused');
      expect(updatePresence('active')).toBe('active');
      expect(updatePresence('idle')).toBe('idle');
    });
  });

  describe('Stream', () => {
    it('should create valid stream objects', () => {
      const stream: Stream = {
        id: 'test-stream',
        type: 'focused',
        timestamp: Date.now(),
        data: { value: 1 }
      };

      expect(stream.id).toBe('test-stream');
      expect(stream.type).toBe('focused');
      expect(stream.timestamp).toBeDefined();
      expect(stream.data).toEqual({ value: 1 });
    });

    it('should handle optional data property', () => {
      const stream: Stream = {
        id: 'test-stream',
        type: 'active',
        timestamp: Date.now()
      };

      expect(stream.id).toBe('test-stream');
      expect(stream.type).toBe('active');
      expect(stream.timestamp).toBeDefined();
      expect(stream.data).toBeUndefined();
    });
  });
}); 