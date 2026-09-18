import { describe, expect, it } from 'vitest';
import { firstRelated } from './relation';
describe('PostgREST one-to-one relations', () => {
  it('preserves a saved decision returned as an object', () => {
    expect(firstRelated({decision:'going'})).toEqual({decision:'going'});
  });
  it('accepts legacy arrays and missing optional records', () => {
    expect(firstRelated([{decision:'pass'}])?.decision).toBe('pass');
    expect(firstRelated(null)).toBeUndefined();
    expect(firstRelated([])).toBeUndefined();
  });
});
