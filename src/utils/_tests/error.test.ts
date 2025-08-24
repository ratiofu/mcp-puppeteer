import { describe, it, expect } from 'vitest';
import { errorToString } from '../../utils/error.js';

describe('errorToString', () => {
  it('handles Error instances', () => {
    const msg = errorToString(new Error('Boom'));
    expect(msg).toBe('Boom');
  });

  it('returns raw strings', () => {
    expect(errorToString('oops')).toBe('oops');
  });

  it('stringifies primitives', () => {
    expect(errorToString(42)).toBe('42');
    expect(errorToString(false)).toBe('false');
  });

  it('handles null and undefined explicitly', () => {
    expect(errorToString(null)).toBe('null');
    expect(errorToString(undefined)).toBe('undefined');
  });

  it('json-stringifies objects and arrays', () => {
    expect(errorToString({ a: 1 })).toBe('{"a":1}');
    expect(errorToString([1, 2, 3])).toBe('[1,2,3]');
  });

  it('falls back to String() when JSON.stringify throws (e.g., circular refs)', () => {
    const a: any = {};
    a.self = a;
    const msg = errorToString(a);
    expect(msg).toBe('[object Object]');
  });
});
