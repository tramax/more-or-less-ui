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
import { BrandPicker } from '../BrandPicker';
import { CodeBlock } from '../CodeBlock';
import { useRootVariables } from '../useRootVariables';
import { TOKEN_CONTROLS } from './tokenPresets';

const EMPTY =
  '/* Nothing changed yet. Pick something above: only what you change shows up here. */';

/**
 * The library's main tokens, within reach. Each control sets a few CSS variables on the page, so the whole
 * page (this panel and the header included) restyles live, and the CSS underneath is exactly what you would
 * paste into your own stylesheet.
 */
export function Customiser() {
  const [brand, setBrand] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, string>>({});

  const vars: Record<string, string> = {};
  if (brand) vars['--color-primary'] = brand;
  for (const control of TOKEN_CONTROLS) {
    const preset = control.presets.find((p) => p.value === chosen[control.key]);
    Object.assign(vars, preset?.vars);
  }
  useRootVariables(vars);

  const entries = Object.entries(vars);
  const css = entries.length
    ? `:root {\n${entries.map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}`
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

        <Stack direction="row" gap="more" align="end" wrap>
          <BrandPicker color={brand} onChange={setBrand} />
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
