import { describe, it, expect, vi, afterEach } from 'vitest';
import { isTruthy, detectPlatform } from '../envUtils.js';

describe('envUtils', () => {
  describe('isTruthy', () => {
    it('should return true for "1"', () => {
      expect(isTruthy('1')).toBe(true);
    });

    it('should return true for "true"', () => {
      expect(isTruthy('true')).toBe(true);
    });

    it('should return true for "True"', () => {
      expect(isTruthy('True')).toBe(true);
    });

    it('should return true for "t"', () => {
      expect(isTruthy('t')).toBe(true);
    });

    it('should return true for "T"', () => {
      expect(isTruthy('T')).toBe(true);
    });

    it('should return false for "0"', () => {
      expect(isTruthy('0')).toBe(false);
    });

    it('should return false for "false"', () => {
      expect(isTruthy('false')).toBe(false);
    });

    it('should return false for "no"', () => {
      expect(isTruthy('no')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTruthy(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isTruthy('')).toBe(false);
    });
  });

  describe('detectPlatform', () => {
    const originalPlatform = process.platform;
    const originalArch = process.arch;

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
      Object.defineProperty(process, 'arch', { value: originalArch });
    });

    it('should detect macOS Apple Silicon', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });

      const platform = detectPlatform();

      expect(platform).toEqual({
        platform: 'mac-arm64',
        name: 'macOS (Apple Silicon)',
        supported: true
      });
    });

    it('should detect macOS Intel', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const platform = detectPlatform();

      expect(platform).toEqual({
        platform: 'mac-x64',
        name: 'macOS (Intel)',
        supported: true
      });
    });

    it('should detect Linux x64', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const platform = detectPlatform();

      expect(platform).toEqual({
        platform: 'linux64',
        name: 'Linux (x64)',
        supported: true
      });
    });

    it('should handle unsupported Linux architecture', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'arm' });

      const platform = detectPlatform();

      expect(platform).toEqual({
        platform: 'linux64',
        name: 'Linux (arm)',
        supported: false
      });
    });

    it('should detect Windows x64', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const platform = detectPlatform();

      expect(platform).toEqual({
        platform: 'win64',
        name: 'Windows (x64)',
        supported: true
      });
    });

    it('should detect Windows x86', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      Object.defineProperty(process, 'arch', { value: 'ia32' });

      const platform = detectPlatform();

      expect(platform).toEqual({
        platform: 'win32',
        name: 'Windows (x86)',
        supported: true
      });
    });

    it('should handle unsupported platforms', () => {
      Object.defineProperty(process, 'platform', { value: 'freebsd' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const platform = detectPlatform();

      expect(platform).toEqual({
        platform: 'linux64',
        name: 'freebsd (x64)',
        supported: false
      });
    });
  });
});