import { Button, Card, Grid, Link, Stack, Text, Title } from 'more-or-less-ui';
import { CodeBlock } from '../CodeBlock';
import { Customiser } from '../demos/Customiser';
import { STORYBOOK_URL } from '../links';
import { Part } from '../Part';
import { useRouter } from '../router';
import { Showcase } from '../showcase/Showcase';
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

      <section className={styles.sectionTight} aria-labelledby="try-title">
        <Stack gap="more">
          <Stack gap="normal" className={styles.heroText}>
            <Title as="h2" id="try-title">
              See it, then make it yours
            </Title>
            <Text as="p">
              Below is a booking page for a pottery studio, built from nothing but this library. Use
              it, then change the tokens and watch every part follow. A look of your own takes a few
              variables, not a rewrite.
            </Text>
          </Stack>
          <Customiser />
          <Showcase />
        </Stack>
      </section>

      <section className={styles.section} aria-labelledby="why-three-title">
        <Stack gap="more">
          <Stack gap="normal" className={styles.heroText}>
            <Title as="h2" id="why-three-title">
              Why three
            </Title>
            <Text as="p">
              Every choice is something a person has to read, compare and remember, whether they use
              the interface or build it. Three is what we kept.
            </Text>
          </Stack>

          <Card padding="more">
            <Stack gap="more">
              <Title as="h3">
                Less to decide, for the person using it and the person building it
              </Title>
              <Part label="Why">
                <Stack gap="normal">
                  <Text as="p">
                    People choose slower as the options grow, and they hold about four things in
                    mind at once, not seven. Three steps fit. Nobody looks up whether{' '}
                    <code>md</code> is bigger than <code>base</code>: the words say it.
                  </Text>
                  <Text as="p">
                    For the person using it, a card and a button agree, so nothing is learned twice.
                    For the person building it, there is one rule and fifteen variables to theme.
                  </Text>
                </Stack>
              </Part>
              <Part label="The honest limit">
                <Text as="p">
                  More choice is not always worse: across 50 experiments the average effect was
                  close to zero. Our claim is narrower. On one ordered scale, three steps you can
                  tell apart beat five that blur. We have not measured that here.
                </Text>
              </Part>
            </Stack>
          </Card>

          <Card padding="more">
            <Stack gap="more">
              <Title as="h3">Easier for a coding agent to get right</Title>
              <Part label="Why">
                <Text as="p">
                  Code models invent props and misuse APIs, and they choose worse as the options
                  pile up. A closed vocabulary leaves little to invent: the same three words work on
                  every prop, and there is no <code>variant</code>, no color named for a meaning.
                  And <code>less</code> says what you meant, so whoever reviews the agent’s work can
                  read it at a glance.
                </Text>
              </Part>
              <Part label="The honest limit">
                <Text as="p">
                  Nobody has compared three steps with five for agent-written code. This is an
                  inference from the findings, not a result. And the library does not enforce it:{' '}
                  <code>size</code> takes any CSS length, so <code>size=&quot;lg&quot;</code> is not
                  a type error. It is quietly ignored.
                </Text>
              </Part>
            </Stack>
          </Card>
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
