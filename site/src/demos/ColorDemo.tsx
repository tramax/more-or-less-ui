import { useEffect, useState } from 'react';
import {
  Avatar,
  Banner,
  Button,
  Chip,
  Grid,
  Indicator,
  Link,
  Progress,
  SegmentedControl,
  Slider,
  Stack,
  Text,
  TextField,
  Toggle,
  setCSSVariable,
} from 'more-or-less-ui';
import { Cell } from './Cell';
import styles from '../site.module.css';

// Light, dark, mid and pale on purpose: the text on each one re-picks black or white by itself
const BRANDS = [
  { value: 'Sand', color: null },
  { value: 'Ocean', color: '#2f6fb0' },
  { value: 'Moss', color: '#7aa35a' },
  { value: 'Rose', color: '#d4849f' },
  { value: 'Violet', color: '#5a4a9c' },
];

/**
 * Change the one brand color and the whole page follows, this card and the header included. It is set on
 * the page (`:root`), where every derived color is computed, and put back when you leave the page.
 */
export function ColorDemo() {
  const [brand, setBrand] = useState<string | null>('Sand');
  const [custom, setCustom] = useState<string | null>(null);
  const color = custom ?? BRANDS.find((b) => b.value === brand)?.color ?? null;

  useEffect(() => {
    const root = document.documentElement;
    if (color) setCSSVariable('--color-primary', color);
    else root.style.removeProperty('--color-primary');
    return () => {
      root.style.removeProperty('--color-primary');
    };
  }, [color]);

  return (
    <Stack gap="more">
      <Cell promise="This changes the whole page, not only this card. One value: --color-primary.">
        <Stack direction="row" gap="more" align="end" wrap>
          <SegmentedControl
            label="Brand color"
            options={BRANDS.map(({ value }) => ({ value, label: value }))}
            value={custom ? null : brand}
            onChange={(value) => {
              setCustom(null);
              setBrand(value);
            }}
          />
          <label className={styles.colorPicker}>
            <Text size="less" color="less">
              Or any color
            </Text>
            <input
              type="color"
              value={color ?? '#c6b18b'}
              onChange={(event) => setCustom(event.target.value)}
            />
          </label>
        </Stack>
      </Cell>

      <Grid columns={{ minWidth: '15rem' }} gap="more">
        <Cell promise="Button: the tint, the fill, and the label on it, black or white by contrast.">
          <Stack direction="row" gap="normal" wrap>
            <Button>Normal</Button>
            <Button background="more">More</Button>
          </Stack>
        </Cell>

        <Cell promise="Chip and Toggle: the fill when on.">
          <Stack direction="row" gap="normal" align="center" wrap>
            <Chip isSelected onSelectedChange={() => undefined}>
              Selected
            </Chip>
            <Toggle label="On" defaultChecked />
          </Stack>
        </Cell>

        <Cell promise="Field: the brand color at 15%, and the focus edge.">
          <TextField label="Email" defaultValue="ada@example.com" />
        </Cell>

        <Cell promise="Progress and Slider: the track at 20%, the fill.">
          <Stack gap="normal">
            <Progress value={60} aria-label="Upload progress" />
            <Slider label="Volume" defaultValue={40} />
          </Stack>
        </Cell>

        <Cell promise="Badge: a darker mix, so it can be seen on its own.">
          <Indicator count={3} label="3 unread messages">
            <Avatar name="Ada Lovelace" />
          </Indicator>
        </Cell>

        <Cell promise="Banner, text and link: the same color at other strengths.">
          <Stack gap="normal">
            <Banner background="more" title="A banner">
              Filled with the brand color.
            </Banner>
            <Text>
              <Text color="more" fontWeight="more">
                Emphasis
              </Text>{' '}
              and <Link href="/principles/derived-color">a link</Link>.
            </Text>
          </Stack>
        </Cell>
      </Grid>
    </Stack>
  );
}
