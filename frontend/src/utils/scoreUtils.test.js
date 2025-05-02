import { describe, it, expect } from 'vitest';
import { getScoreColor } from './scoreUtils';

describe('scoreUtils', () => {
  describe('getScoreColor', () => {
    it('should return the correct color for score 4', () => {
      expect(getScoreColor(4)).toBe('#4CAF50');
      expect(getScoreColor('4')).toBe('#4CAF50');
    });

    it('should return the correct color for score 3.5', () => {
      expect(getScoreColor(3.5)).toBe('#66BB6A');
      expect(getScoreColor('3.5')).toBe('#66BB6A');
    });

    it('should return the correct color for score 3', () => {
      expect(getScoreColor(3)).toBe('#8BC34A');
      expect(getScoreColor('3')).toBe('#8BC34A');
    });

    it('should return the correct color for score 2.5', () => {
      expect(getScoreColor(2.5)).toBe('#AED581');
      expect(getScoreColor('2.5')).toBe('#AED581');
    });

    it('should return the correct color for score 2', () => {
      expect(getScoreColor(2)).toBe('#FFC107');
      expect(getScoreColor('2')).toBe('#FFC107');
    });

    it('should return the correct color for score 1', () => {
      expect(getScoreColor(1)).toBe('#FF9800');
      expect(getScoreColor('1')).toBe('#FF9800');
    });

    it('should return the correct color for score 0', () => {
      expect(getScoreColor(0)).toBe('#FF5722');
      expect(getScoreColor('0')).toBe('#FF5722');
    });

    it('should return the correct color for score -1', () => {
      expect(getScoreColor(-1)).toBe('#F44336');
      expect(getScoreColor('-1')).toBe('#F44336');
    });

    it('should return black for any other score', () => {
      expect(getScoreColor(5)).toBe('#000000');
      expect(getScoreColor(-2)).toBe('#000000');
      expect(getScoreColor('invalid')).toBe('#000000');
    });
  });
});
