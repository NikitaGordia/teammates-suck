import { describe, it, expect } from 'vitest';
import { getScoreColor } from './scoreUtils';

describe('scoreUtils', () => {
  describe('getScoreColor', () => {
    it('should return the correct color for score 5', () => {
      expect(getScoreColor(5)).toBe('#1B5E20');
      expect(getScoreColor('5')).toBe('#1B5E20');
    });

    it('should return the correct color for score 4.9', () => {
      expect(getScoreColor(4.9)).toBe('#2E7D32');
      expect(getScoreColor('4.9')).toBe('#2E7D32');
    });

    it('should return the correct color for score 4.8', () => {
      expect(getScoreColor(4.8)).toBe('#388E3C');
      expect(getScoreColor('4.8')).toBe('#388E3C');
    });

    it('should return the correct color for score 4.7', () => {
      expect(getScoreColor(4.7)).toBe('#43A047');
      expect(getScoreColor('4.7')).toBe('#43A047');
    });

    it('should return the correct color for score 4.6', () => {
      expect(getScoreColor(4.6)).toBe('#4CAF50');
      expect(getScoreColor('4.6')).toBe('#4CAF50');
    });

    it('should return the correct color for score 4.5', () => {
      expect(getScoreColor(4.5)).toBe('#56C85A');
      expect(getScoreColor('4.5')).toBe('#56C85A');
    });

    it('should return the correct color for score 4.4', () => {
      expect(getScoreColor(4.4)).toBe('#60D164');
      expect(getScoreColor('4.4')).toBe('#60D164');
    });

    it('should return the correct color for score 4.3', () => {
      expect(getScoreColor(4.3)).toBe('#6ADA6E');
      expect(getScoreColor('4.3')).toBe('#6ADA6E');
    });

    it('should return the correct color for score 4.2', () => {
      expect(getScoreColor(4.2)).toBe('#74E378');
      expect(getScoreColor('4.2')).toBe('#74E378');
    });

    it('should return the correct color for score 4.1', () => {
      expect(getScoreColor(4.1)).toBe('#7EEC82');
      expect(getScoreColor('4.1')).toBe('#7EEC82');
    });

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
      expect(getScoreColor(6)).toBe('#000000');
      expect(getScoreColor(-2)).toBe('#000000');
      expect(getScoreColor('invalid')).toBe('#000000');
    });
  });
});
