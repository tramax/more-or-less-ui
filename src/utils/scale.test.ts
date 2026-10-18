import { describe, it, expect } from 'vitest';
import { getVariantClass, resolveScaleProps, toCssValue } from './scale';

const classes = {
  paddingLess: 'p-less',
  paddingNormal: 'p-normal',
  paddingMore: 'p-more',
  sizeMore: 's-more',
};
const spec = {
  direct: ['padding'],
  compound: { size: ['fontSize', 'padding', 'gap'] },
} as const;

describe('toCssValue', () => {
  it('turns numbers into pixels and leaves strings alone', () => {
    expect(toCssValue(16)).toBe('16px');
    expect(toCssValue(0)).toBe('0px');
    expect(toCssValue('1.5rem')).toBe('1.5rem');
  });
});

describe('getVariantClass', () => {
  it('looks up <prop><Variant>', () => {
    expect(getVariantClass(classes, 'padding', 'less')).toBe('p-less');
    expect(getVariantClass(classes, 'padding', 'normal')).toBe('p-normal');
    expect(getVariantClass(classes, 'padding', 'more')).toBe('p-more');
  });

  it('returns undefined for escape hatches, undefined and unknown classes', () => {
    expect(getVariantClass(classes, 'padding', '12px')).toBeUndefined();
    expect(getVariantClass(classes, 'padding', 12)).toBeUndefined();
    expect(getVariantClass(classes, 'padding', undefined)).toBeUndefined();
    expect(getVariantClass(classes, 'size', 'less')).toBeUndefined();
  });
});

describe('resolveScaleProps', () => {
  it('returns nothing when no values are given', () => {
    expect(resolveScaleProps(classes, spec, {})).toEqual({ classNames: [], style: {}, rest: {} });
  });

  it('collects classes for variants', () => {
    const r = resolveScaleProps(classes, spec, { padding: 'more', size: 'more' });
    expect(r.classNames).toEqual(['p-more', 's-more']);
    expect(r.style).toEqual({});
  });

  it('writes a direct prop escape hatch to the CSS property of the same name', () => {
    const r = resolveScaleProps(classes, spec, { padding: '12px 24px' });
    expect(r.classNames).toEqual([]);
    expect(r.style).toEqual({ padding: '12px 24px' });
  });

  it('writes a compound prop escape hatch to every CSS property it drives', () => {
    const r = resolveScaleProps(classes, spec, { size: '1.5rem' });
    expect(r.classNames).toEqual([]);
    expect(r.style).toEqual({ fontSize: '1.5rem', padding: '1.5rem', gap: '1.5rem' });
  });

  it('converts numbers to pixels', () => {
    expect(resolveScaleProps(classes, spec, { padding: 8 }).style).toEqual({ padding: '8px' });
  });

  it('skips a variant with no matching class instead of throwing', () => {
    expect(resolveScaleProps(classes, spec, { size: 'less' }).classNames).toEqual([]);
  });

  describe('defaults', () => {
    const withDefaults = { ...spec, defaults: { padding: 'normal', size: 'more' } } as const;

    it('applies the default variant to props left undefined', () => {
      const r = resolveScaleProps(classes, withDefaults, {});
      expect(r.classNames).toEqual(['p-normal', 's-more']);
    });

    it('treats an explicit undefined like an omitted prop', () => {
      const r = resolveScaleProps(classes, withDefaults, { padding: undefined });
      expect(r.classNames).toEqual(['p-normal', 's-more']);
    });

    it('lets a given variant or escape hatch replace the default', () => {
      expect(resolveScaleProps(classes, withDefaults, { padding: 'more' }).classNames).toEqual([
        'p-more',
        's-more',
      ]);
      const r = resolveScaleProps(classes, withDefaults, { padding: 0 });
      expect(r.classNames).toEqual(['s-more']);
      expect(r.style).toEqual({ padding: '0px' });
    });

    it('does not leak defaulted props into rest', () => {
      expect(
        resolveScaleProps(classes, withDefaults, { padding: undefined, id: 'a' }).rest,
      ).toEqual({ id: 'a' });
    });
  });

  it('returns the other props as rest, without the scale props', () => {
    const r = resolveScaleProps(classes, spec, { padding: 'more', size: 4, id: 'a', title: 'b' });
    expect(r.rest).toEqual({ id: 'a', title: 'b' });
  });
});
