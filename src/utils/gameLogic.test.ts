import { describe, it, expect } from 'vitest';
import { calculateScore, getTauntLevel } from './gameLogic';

describe('Game Logic', () => {
  it('calculates base score correctly for Round 1', () => {
    const score = calculateScore(0, 1);
    expect(score).toBe(100);
  });

  it('calculates score with multiplier for Round 3', () => {
    // Round 3 = 1 + (2 * 0.1) = 1.2 multiplier
    // 100 * 1.2 = 120
    const score = calculateScore(0, 3);
    expect(score).toBe(120);
  });

  it('adds headshot bonus', () => {
    const score = calculateScore(0, 1, true); // 100 + 50
    expect(score).toBe(150);
  });

  it('determines correct taunt level', () => {
    expect(getTauntLevel(1)).toBe('mild');
    expect(getTauntLevel(5)).toBe('medium');
    expect(getTauntLevel(10)).toBe('savage');
  });
});
