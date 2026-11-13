import { useState } from 'react';
import {
  Button,
  Card,
  Collapsible,
  Grid,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from 'more-or-less-ui';
import { BrandPicker, DEFAULT_BRAND } from '../BrandPicker';
import { CodeBlock } from '../CodeBlock';
import styles from '../site.module.css';
import { useRootVariables } from '../useRootVariables';
import { useStylesheet } from '../useStylesheet';
import { LOOKS } from './lookPresets';
import { TOKEN_CONTROLS } from './tokenPresets';

const EMPTY =
  '/* Nothing changed yet. Pick something above: only what you change shows up here. */';

/**
 * The library's main tokens, within reach. A look sets dozens of CSS variables at once; each control below
 * sets a few more on top of it. They all go on the page, so the whole page (this panel and the header
 * included) restyles live, and the CSS underneath is exactly what you would paste into your own stylesheet.
 */
export function Customiser() {
  const [lookKey, setLookKey] = useState('default');
  const [brand, setBrand] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, string>>({});

  // Layers, each over the one before: the look, then the brand color, then the single controls
  const look = LOOKS.find((l) => l.value === lookKey) ?? LOOKS[0]!;
  const lookBrand = look.vars['--color-primary'] ?? null;
  const vars: Record<string, string> = { ...look.vars };
  if (brand) vars['--color-primary'] = brand;
  for (const control of TOKEN_CONTROLS) {
    const preset = control.presets.find((p) => p.value === chosen[control.key]);
    Object.assign(vars, preset?.vars);
  }
  useRootVariables(vars);
  useStylesheet(look.fonts);

  const entries = Object.entries(vars);
  // A look's typeface has to be loaded by whoever pastes it, so the line that loads it is part of the CSS
  const fonts = look.fonts ? `@import url('${look.fonts}');\n\n` : '';
  const css = entries.length
    ? `${fonts}:root {\n${entries.map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}`
    : EMPTY;

  return (
    <Card padding="more">
      <Stack gap="more">
        <Stack gap="less">
          <Title as="h3">The tokens</Title>
          <Text as="p" color="less">
            Every control sets a few CSS variables, and the whole page follows. That is all a theme
            is.
          </Text>
        </Stack>

        <Stack gap="less">
          {/* Eight segments are wider than a phone, so the row scrolls inside its own box, not the page */}
          <div className={styles.scrollX}>
            <SegmentedControl
              label="A whole look"
              tooltip="Sets dozens of variables at once: the three scales, both typefaces, the shadows, the motion and most of the colors. The controls below change things on top of it."
              options={LOOKS.map(({ value, label }) => ({ value, label }))}
              value={lookKey}
              onChange={(value) => {
                // A look is a fresh start, so what was changed on top of the last one goes
                setLookKey(value);
                setBrand(null);
                setChosen({});
              }}
            />
          </div>
          <Text as="p" size="less" color="less">
            {look.description}
          </Text>
        </Stack>

        <Stack direction="row" gap="more" align="end" wrap>
          <BrandPicker
            color={brand ?? lookBrand}
            // Sand is the library's own color; under a look that has its own, it has to be said out loud
            onChange={(color) => setBrand(color ?? (lookBrand ? DEFAULT_BRAND : null))}
          />
        </Stack>

        <Grid columns={{ minWidth: '18rem' }} gap="more">
          {TOKEN_CONTROLS.map((control) => (
            <SegmentedControl
              key={control.key}
              label={control.label}
              tooltip={control.tooltip}
              options={control.presets.map(({ value, label }) => ({ value, label }))}
              value={chosen[control.key] ?? 'default'}
              onChange={(value) => setChosen((all) => ({ ...all, [control.key]: value }))}
            />
          ))}
        </Grid>

        <Stack direction="row" gap="normal" align="center" wrap>
          <Button
            background="less"
            isDisabled={entries.length === 0}
            onClick={() => {
              setLookKey('default');
              setBrand(null);
              setChosen({});
            }}
          >
            Start again
          </Button>
          <Text size="less" color="less">
            {entries.length === 0
              ? 'The library as it comes.'
              : `${entries.length} ${entries.length === 1 ? 'variable' : 'variables'} changed.`}
          </Text>
        </Stack>

        <Collapsible title="The CSS for this look" defaultIsOpen>
          <CodeBlock code={css} label="The CSS for this look" />
        </Collapsible>
      </Stack>
    </Card>
  );
}
