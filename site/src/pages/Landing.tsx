import { Button, Link, Stack, Text, Title } from 'more-or-less-ui';
import { CodeBlock } from '../CodeBlock';
import { Customiser } from '../demos/Customiser';
import { HeroMark } from '../HeroMark';
import { InfoCards, type InfoCardItem } from '../InfoCards';
import { STORYBOOK_URL } from '../links';
import { SectionIntro } from '../SectionIntro';
import { useRouter } from '../router';
import { Showcase } from '../showcase/Showcase';
import styles from '../site.module.css';

const STRENGTHS: InfoCardItem[] = [
  {
    key: 'variables',
    title: 'Theme with CSS variables',
    text: 'Fifteen variables set every size, radius, weight, space and shadow; a few more set color. Change them on :root, or on any element to restyle only what is inside it.',
  },
  {
    key: 'props',
    title: 'A small interface',
    text: 'Style props take less, normal or more, and the defaults already look right. Write <Button background="more"> and it works; there is no variant list to learn.',
  },
  {
    key: 'extend',
    title: 'Extend it your way',
    text: 'Need a component we do not have? Build it from the same tokens and principles and it sits beside the rest, looking like it belongs.',
  },
];

const REASONS: InfoCardItem[] = [
  {
    key: 'decide',
    title: 'Less to decide',
    text: (
      <>
        People choose slower as options grow, and hold about four things in mind at once. Three
        steps fit, and nobody looks up whether <code>md</code> is bigger than <code>base</code>: the
        words say it.
      </>
    ),
  },
  {
    key: 'look',
    title: 'A look that holds together',
    text: 'With only three sizes, radii and shadows, the same few values repeat across a page, and repetition is what makes a design look deliberate.',
  },
  {
    key: 'agent',
    title: 'Easier for a coding agent',
    text: 'Code models invent props and choose worse as options pile up. One vocabulary on every prop leaves little to invent, and the result is quick to review.',
  },
];

const ENTRY_POINTS: InfoCardItem[] = [
  {
    key: 'principles',
    title: <Link href="/principles">Principles</Link>,
    text: 'The decisions that run through every component, each with its reasons and what it costs.',
  },
  {
    key: 'components',
    title: (
      <Link href={STORYBOOK_URL} target="_blank" rel="noopener">
        Components
      </Link>
    ),
    text: 'Every component in Storybook: try each one, change its props, and read how it behaves.',
  },
  {
    key: 'about',
    title: <Link href="/about">About</Link>,
    text: 'Who made it, and the experience in human-computer interaction behind the choices.',
  },
];

export function Landing() {
  const { navigate } = useRouter();

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroGrid}>
          <Stack gap="more">
            {/* The one place that goes past `more`: a display size, as an escape hatch value */}
            <Title
              as="h1"
              size="clamp(2.75rem, 1.5rem + 5vw, 5rem)"
              fontWeight="more"
              color="more"
              id="hero-title"
            >
              Three choices for everything
            </Title>
            <Text as="p" size="more" color="less">
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
          <HeroMark />
        </div>
      </section>

      <section className={styles.sectionTight} aria-labelledby="try-title">
        <Stack gap="more">
          <SectionIntro id="try-title" title="See it, then make it yours">
            Below is a booking page for a pottery studio, built from nothing but this library. Use
            it, then try a whole look or change the tokens one at a time, and watch every part
            follow. A look of your own takes a few variables, not a rewrite.
          </SectionIntro>
          <Customiser />
          <Showcase />
        </Stack>
      </section>

      <section className={styles.section} aria-labelledby="ready-title">
        <Stack gap="more">
          <SectionIntro id="ready-title" title="Beautiful before you have learned anything">
            Every component looks finished with no setup. Reach for the same three words and a few
            variables, and it stays that way.
          </SectionIntro>
          <InfoCards items={STRENGTHS} />
        </Stack>
      </section>

      <section className={styles.section} aria-labelledby="why-three-title">
        <Stack gap="more">
          <SectionIntro id="why-three-title" title="Why three">
            Every choice is something a person has to read, compare and remember. Three is what we
            kept.
          </SectionIntro>
          <InfoCards items={REASONS} />
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

      <section className={styles.section} aria-labelledby="explore-title">
        <Stack gap="more">
          <Title as="h2" id="explore-title">
            Keep exploring
          </Title>
          <InfoCards items={ENTRY_POINTS} />
        </Stack>
      </section>
    </div>
  );
}
