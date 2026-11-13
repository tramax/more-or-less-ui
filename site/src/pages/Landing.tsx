import { Button, Card, Grid, Link, Stack, Text, Title } from 'more-or-less-ui';
import { CodeBlock } from '../CodeBlock';
import { ScaleDemo } from '../demos/ScaleDemo';
import { STORYBOOK_URL } from '../links';
import { useRouter } from '../router';
import styles from '../site.module.css';

const ENTRY_POINTS = [
  {
    href: '/principles',
    title: 'Principles',
    text: 'The decisions that run through every component, each with its reasons and what it costs.',
  },
  {
    href: '/components',
    title: 'Components',
    text: 'Why each component is the way it is: what it does differently, and the research behind it.',
  },
  {
    href: '/about',
    title: 'About',
    text: 'Who made it, and the experience in human-computer interaction behind the choices.',
  },
];

export function Landing() {
  const { navigate } = useRouter();

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <Stack gap="more">
          <Title as="h1" size="more" id="hero-title">
            Three sizes for everything
          </Title>
          <Text as="p" size="more" color="less" className={styles.heroText}>
            A React component library where every size, radius, weight, space and shadow is less,
            normal or more, and every one of them is a CSS variable you can change.
          </Text>
          <Stack direction="row" gap="more" align="center" wrap>
            <Button background="more" size="more" onClick={() => navigate('/principles')}>
              Read the reasoning
            </Button>
            <Link href={STORYBOOK_URL} target="_blank" rel="noopener" size="more">
              Try the components in Storybook
            </Link>
          </Stack>
        </Stack>
      </section>

      <section className={styles.section} aria-labelledby="idea-title">
        <Stack gap="more">
          <Title as="h2" id="idea-title">
            The idea
          </Title>
          <Text as="p" className={styles.heroText}>
            Each column below is one word, handed to every part of it. There is no second vocabulary
            to learn for the card, the field or the button.
          </Text>
          <ScaleDemo />
        </Stack>
      </section>

      <section className={styles.section} aria-labelledby="start-title">
        <Stack gap="more">
          <Title as="h2" id="start-title">
            Start
          </Title>
          <CodeBlock
            label="Install and import the library"
            code={`npm install more-or-less-ui

import 'more-or-less-ui/styles.css';
import { Button } from 'more-or-less-ui';`}
          />
        </Stack>
      </section>

      <section className={styles.section} aria-labelledby="reasoning-title">
        <Stack gap="more">
          <Title as="h2" id="reasoning-title">
            The reasoning
          </Title>
          <Grid columns={{ minWidth: '18rem' }} gap="more">
            {ENTRY_POINTS.map((entry) => (
              <Card key={entry.href}>
                <Stack gap="normal">
                  <Title as="h3" size="less">
                    <Link href={entry.href}>{entry.title}</Link>
                  </Title>
                  <Text as="p" color="less">
                    {entry.text}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      </section>
    </div>
  );
}
