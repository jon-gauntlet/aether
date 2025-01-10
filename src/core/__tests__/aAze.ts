import '../toBeInRange';

describe('toBeInRange matcher', () => {
  it('passes when number is within range', () => {
    expect(5).toBeInRange(0, 10);
    expect(0).toBeInRange(0, 10);
    expect(10).toBeInRange(0, 10);
    expect(3.14).toBeInRange(3, 4);
  });

  it('fails when number is outside range', () => {
    expect(() => expect(-1).toBeInRange(0, 10)).toThrow();
    expect(() => expect(11).toBeInRange(0, 10)).toThrow();
    expect(() => expect(2.9).toBeInRange(3, 4)).toThrow();
    expect(() => expect(4.1).toBeInRange(3, 4)).toThrow();
  });

  it('handles edge cases', () => {
    expect(5).toBeInRange(5, 5); // Same number
    expect(0).toBeInRange(0, 0); // Zero
    expect(-5).toBeInRange(-10, 0); // Negative numbers
    expect(Number.EPSILON).toBeInRange(0, 1); // Very small number
  });

  it('validates range parameters', () => {
    expect(5).toBeInRange(1, 10); // Normal range
    expect(5).toBeInRange(5, 10); // Min boundary
    expect(5).toBeInRange(0, 5); // Max boundary
  });
}); 