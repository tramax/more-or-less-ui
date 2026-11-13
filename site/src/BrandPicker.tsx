import { SegmentedControl, Text } from 'more-or-less-ui';
import styles from './site.module.css';

/** The library's own brand color, which a `null` color leaves to the stylesheet. */
export const DEFAULT_BRAND = '#c6b18b';

// Light, dark, mid and pale on purpose: the text on each one re-picks black or white by itself
const BRANDS = [
  { value: 'Sand', color: null },
  { value: 'Ocean', color: '#2f6fb0' },
  { value: 'Moss', color: '#7aa35a' },
  { value: 'Rose', color: '#d4849f' },
  { value: 'Violet', color: '#5a4a9c' },
];

/**
 * The one brand color: five to start from, or any color. `color` is `null` for the library's own.
 * The caller applies it (`useRootVariables({ '--color-primary': color })`).
 */
export function BrandPicker({
  color,
  onChange,
}: {
  color: string | null;
  onChange: (color: string | null) => void;
}) {
  const selected = BRANDS.find((brand) => brand.color === color)?.value ?? null;

  return (
    <>
      <SegmentedControl
        label="Brand color"
        tooltip="Sets --color-primary. The fills, tints, shadows, focus ring and the text on them are all derived from it."
        options={BRANDS.map(({ value }) => ({ value, label: value }))}
        value={selected}
        onChange={(value) => onChange(BRANDS.find((brand) => brand.value === value)?.color ?? null)}
      />
      <label className={styles.colorPicker}>
        <Text size="less" color="less">
          Or any color
        </Text>
        <input
          type="color"
          value={color ?? DEFAULT_BRAND}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </>
  );
}
