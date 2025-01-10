import { NaturalFlowType } from '../base';

describe('NaturalFlowType', () => {
  it('should accept valid flow types', () => {
    const validTypes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];
    validTypes.forEach(type => {
      expect(type).toBeDefined();
    });
  });

  it('should have exactly three possible values', () => {
    const validTypes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];
    expect(validTypes.length).toBe(3);
  });

  it('should be used in type-safe contexts', () => {
    const flowType: NaturalFlowType = 'natural';
    expect(flowType).toBe('natural');

    const updateType = (type: NaturalFlowType) => type;
    expect(updateType('guided')).toBe('guided');
    expect(updateType('resonant')).toBe('resonant');
  });
}); 