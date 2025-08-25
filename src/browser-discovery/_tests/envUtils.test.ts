import { describe, it, expect } from 'vitest';
import { isTruthy } from '../envUtils.js';

describe('envUtils', () => {
  describe('isTruthy', () => {
    it('should return true for "1"', () => {
      expect(isTruthy('1')).toBe(true);
    });

    it('should return true for "true"', () => {
      expect(isTruthy('true')).toBe(true);
    });

    it('should return true for "TRUE"', () => {
      expect(isTruthy('TRUE')).toBe(true);
    });

    it('should return true for "t"', () => {
      expect(isTruthy('t')).toBe(true);
    });

    it('should return true for "T"', () => {
      expect(isTruthy('T')).toBe(true);
    });

    it('should return true for "10" (starts with 1)', () => {
      expect(isTruthy('10')).toBe(true);
    });

    it('should return true for "tfalse" (starts with t)', () => {
      expect(isTruthy('tfalse')).toBe(true);
    });

    it('should return false for "false"', () => {
      expect(isTruthy('false')).toBe(false);
    });

    it('should return false for "0"', () => {
      expect(isTruthy('0')).toBe(false);
    });

    it('should return false for "no"', () => {
      expect(isTruthy('no')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isTruthy('')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTruthy(undefined)).toBe(false);
    });

    it('should return false for "2"', () => {
      expect(isTruthy('2')).toBe(false);
    });

    it('should return false for "yes"', () => {
      expect(isTruthy('yes')).toBe(false);
    });
  });
});