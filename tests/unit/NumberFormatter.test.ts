import { describe, it, expect } from 'vitest';
import { format } from '../../src/game/NumberFormatter';

describe('NumberFormatter', () => {
  it('formats 0 as "0"', () => expect(format(0)).toBe('0'));
  it('formats 999 as "999"', () => expect(format(999)).toBe('999'));
  it('formats 1000 as "1,000"', () => expect(format(1000)).toBe('1,000'));
  it('formats 9999 as "9,999"', () => expect(format(9999)).toBe('9,999'));
  it('formats 10000 as "10.00K"', () => expect(format(10000)).toBe('10.00K'));
  it('formats 1500000 as "1.50M"', () => expect(format(1500000)).toBe('1.50M'));
  it('formats 1000000000 as "1.00B"', () => expect(format(1000000000)).toBe('1.00B'));
  it('formats 1e12 as "1.00T"', () => expect(format(1e12)).toBe('1.00T'));
  it('formats 1e15 as "1.00Qa"', () => expect(format(1e15)).toBe('1.00Qa'));
  it('formats 1e18 as "1.00Qi"', () => expect(format(1e18)).toBe('1.00Qi'));
  it('handles Infinity', () => expect(format(Infinity)).toBe('∞'));
  it('handles negative via recursion', () => expect(format(-5000)).toBe('-5,000'));
  it('handles Number.MAX_SAFE_INTEGER without throwing', () => {
    expect(() => format(Number.MAX_SAFE_INTEGER)).not.toThrow();
  });
});
