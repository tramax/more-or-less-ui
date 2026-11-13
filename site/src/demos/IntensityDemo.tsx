import { Banner, Button, Grid, Stack, Text } from 'more-or-less-ui';
import { Cell } from './Cell';

const STEPS = ['less', 'normal', 'more'] as const;

/** Color props take the same three words as everything else: how much it stands out, not what it means. */
export function IntensityDemo() {
  return (
    <Stack gap="more">
      <Grid columns={{ minWidth: '20rem' }} gap="more">
        <Cell promise="Button: background is less, normal or more. Not primary, secondary or danger.">
          <Stack direction="row" gap="normal" align="center" wrap>
            {STEPS.map((step) => (
              <Button key={step} background={step}>
                {step}
              </Button>
            ))}
          </Stack>
        </Cell>

        <Cell promise="Text: color follows the scale. For a meaning, you pass a CSS color yourself.">
          <Stack gap="less">
            {STEPS.map((step) => (
              <Text key={step} color={step}>
                color=&quot;{step}&quot;
              </Text>
            ))}
            <Text color="var(--color-danger)">A CSS color, when it has to mean something</Text>
          </Stack>
        </Cell>
      </Grid>

      <Cell promise="Banner: the same three words. What it means is said in its words, and not in its color.">
        <Stack gap="normal">
          {STEPS.map((step) => (
            <Banner key={step} background={step} title={`background="${step}"`}>
              Your changes weren’t saved. Check your connection and try again.
            </Banner>
          ))}
        </Stack>
      </Cell>
    </Stack>
  );
}
