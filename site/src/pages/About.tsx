import { Link, Stack, Text, Title } from 'more-or-less-ui';
import { InfoCards, type InfoCardItem } from '../InfoCards';
import { GITHUB_URL, LINKEDIN_URL } from '../links';
import { SectionIntro } from '../SectionIntro';
import styles from '../site.module.css';

// What shapes the library, in the author's own terms. Written to be read, not to impress: no résumé,
// which is on LinkedIn.
const BRINGS: InfoCardItem[] = [
  {
    key: 'hci',
    title: 'Trained in human-computer interaction',
    text: 'I am a frontend developer who studied HCI properly, so my first questions about a component are about the person using it: can they tell it is pressable, can they see what went wrong, can they get through it with a keyboard.',
  },
  {
    key: 'eye',
    title: 'An eye for how it looks',
    text: 'I like making things look good, and I trust my taste. I try to back it with research where there is some, and to say so where there is not.',
  },
];

export function About() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-title">
        <Stack gap="normal" className={styles.heroCopy}>
          <Title as="h1" size="more" id="about-title">
            Hello, I am Tra
          </Title>
          <Text as="p" size="more" color="less" className={styles.heroText}>
            I am a frontend developer, and this is a library I am building to make the interfaces I
            work on simpler to get right.
          </Text>
        </Stack>
      </section>

      <section className={styles.sectionTight} aria-labelledby="why-title">
        <SectionIntro id="why-title" title="Why I made it">
          I have built with a lot of component libraries, and I know where they hurt: a prop for
          every possible look, three ways to do one thing, a theme I needed a map to read. Most are
          trying to fit every product. That is a fair goal, but it leaves a large surface to learn
          and many choices to make before anything looks right.
        </SectionIntro>
      </section>

      <section className={styles.sectionTight} aria-labelledby="instead-title">
        <SectionIntro id="instead-title" title="What I wanted instead">
          Something smaller, with one simple way of doing things. Every size, space and weight is
          less, normal or more, and the rest is a CSS variable you can change. It is not trying to
          suit every product. Simple turned out to be the hard part: each option I leave out has to
          be a choice I can explain, and the <Link href="/principles">Principles</Link> are where I
          try.
        </SectionIntro>
      </section>

      <section className={styles.sectionTight} aria-labelledby="bring-title">
        <Stack gap="more">
          <SectionIntro id="bring-title" title="Two things shape how I build it">
            Neither is a claim that I have got it right. They are where the questions come from.
          </SectionIntro>
          <InfoCards items={BRINGS} />
        </Stack>
      </section>

      <section className={styles.section} aria-labelledby="shaping-title">
        <SectionIntro id="shaping-title" title="Still taking shape">
          The library is early, and I am still finding what it gets wrong. Some defaults will
          change. If one gets in your way,{' '}
          <Link href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener">
            please tell me on GitHub
          </Link>
          . And if you would like to talk about it, or about interfaces in general, connect with me
          on{' '}
          <Link href={LINKEDIN_URL} target="_blank" rel="noopener">
            LinkedIn
          </Link>
          .
        </SectionIntro>
      </section>
    </div>
  );
}
