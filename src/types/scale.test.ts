import { describe, it, expect } from 'vitest';
import { isVariant, type ScaleProp, type Variant } from '@/types/scale';

describe('scale types', () => {
  describe('isVariant', () => {
    it('returns true for "less"', () => {
      expect(isVariant('less')).toBe(true);
    });

    it('returns true for "normal"', () => {
      expect(isVariant('normal')).toBe(true);
    });

    it('returns true for "more"', () => {
      expect(isVariant('more')).toBe(true);
    });

    it('returns false for undefined', () => {
      expect(isVariant(undefined)).toBe(false);
    });

    it('returns false for string escape hatch', () => {
      expect(isVariant('1.5rem')).toBe(false);
      expect(isVariant('50%')).toBe(false);
      expect(isVariant('2px')).toBe(false);
    });

    it('returns false for number escape hatch', () => {
      expect(isVariant(16)).toBe(false);
      expect(isVariant(24)).toBe(false);
    });

    it('returns false for invalid string', () => {
      expect(isVariant('invalid')).toBe(false);
      expect(isVariant('')).toBe(false);
    });
  });

  describe('ScaleProp type', () => {
    it('accepts Variant', () => {
      const val: ScaleProp = 'less';
      expect(val).toBe('less');
    });

    it('accepts string escape hatch', () => {
      const val: ScaleProp = '1.5rem';
      expect(val).toBe('1.5rem');
    });

    it('accepts number escape hatch', () => {
      const val: ScaleProp = 16;
      expect(val).toBe(16);
    });

    it('accepts undefined', () => {
      const val: ScaleProp = undefined;
      expect(val).toBeUndefined();
    });
  });

  describe('Variant type', () => {
    it('only accepts less, normal, more', () => {
      const val: Variant = 'more';
      expect(val).toBe('more');
    });
  });
});