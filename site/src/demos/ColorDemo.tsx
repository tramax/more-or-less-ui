import { useState } from 'react';
import {
  Avatar,
  Banner,
  Button,
  Chip,
  Grid,
  Indicator,
  Link,
  Progress,
  Slider,
  Stack,
  Text,
  TextField,
  Toggle,
} from 'more-or-less-ui';
import { BrandPicker } from '../BrandPicker';
import { useRootVariables } from '../useRootVariables';
import { Cell } from './Cell';

/**
 * Change the one brand color and the whole page follows, this card and the header included. It is set on
 * the page (`:root`), where every derived color is computed, and put back when you leave the page.
 */
export function ColorDemo() {
  const [color, setColor] = useState<string | null>(null);
  useRootVariables({ '--color-primary': color });

  return (
    <Stack gap="more">
      <Cell promise="This changes the whole page, not only this card. One value: --color-primary.">
        <Stack direction="row" gap="more" align="end" wrap>
          <BrandPicker color={color} onChange={setColor} />
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
