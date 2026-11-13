import { Button, Card, Grid, Stack, Text, TextField, Title } from 'more-or-less-ui';
import { CodeBlock } from '../CodeBlock';
import styles from '../site.module.css';

const STEPS = ['less', 'normal', 'more'] as const;

const SNIPPET = `<Button size="less">less</Button>
<Button>normal</Button>
<Button size="more">more</Button>
<Button size="1.5rem">exactly this</Button>`;

/**
 * The same three components at each step of the scale, then one escape hatch. Everything in a column is
 * given the one word, so the page shows what the library claims: one scale, and it holds across
 * components (size, radius, space and shadow of the Card, size of the Button and the field).
 */
export function ScaleDemo() {
  return (
    <Stack gap="more">
      <Grid columns={{ minWidth: '18rem' }} gap="more">
        {STEPS.map((step) => (
          <Card key={step} padding={step} borderRadius={step} boxShadow={step}>
            <Stack gap={step}>
              <Text size="less" color="less" className={styles.demoLabel}>
                {step}
              </Text>
              <Title as="h3" size={step}>
                A card
              </Title>
              <TextField label="Email" size={step} defaultValue="ada@example.com" />
              <Stack direction="row" gap={step} wrap>
                <Button size={step}>Save</Button>
                <Button size={step} background="less">
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Card>
        ))}
      </Grid>
      <Stack direction="row" gap="normal" align="center" wrap>
        <Text color="less">Between two steps, or beyond them:</Text>
        <Button size="1.5rem">exactly this</Button>
        <Button size={13} background="less">
          or 13px
        </Button>
      </Stack>
      <CodeBlock code={SNIPPET} label="Button at each step, and an escape hatch" />
    </Stack>
  );
}
