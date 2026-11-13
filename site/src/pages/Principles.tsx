import type { ReactNode } from 'react';
import { Card, Link, Stack, Text, Title } from 'more-or-less-ui';
import { principles, type DemoKey, type Principle } from '../content/principles';
import { AffordanceDemo } from '../demos/AffordanceDemo';
import { ColorDemo } from '../demos/ColorDemo';
import { FormsDemo } from '../demos/FormsDemo';
import { FrameDemo } from '../demos/FrameDemo';
import { IntensityDemo } from '../demos/IntensityDemo';
import { LoadingDemo } from '../demos/LoadingDemo';
import { MotionDemo } from '../demos/MotionDemo';
import { NamesDemo } from '../demos/NamesDemo';
import { NativeDemo } from '../demos/NativeDemo';
import { ScaleDemo } from '../demos/ScaleDemo';
import { Part } from '../Part';
import { anchorId, useRouter } from '../router';
import styles from '../site.module.css';

const DEMOS: Record<DemoKey, () => ReactNode> = {
  scale: ScaleDemo,
  intensity: IntensityDemo,
  affordance: AffordanceDemo,
  names: NamesDemo,
  native: NativeDemo,
  forms: FormsDemo,
  motion: MotionDemo,
  color: ColorDemo,
  loading: LoadingDemo,
  frame: FrameDemo,
};

function PrincipleCard({ principle, number }: { principle: Principle; number: number }) {
  const Demo = DEMOS[principle.demo];
  const permalink = `/principles/${principle.slug}`;

  return (
    <Card id={anchorId('principles', principle.slug)} className={styles.anchor} padding="more">
      <Stack gap="more">
        <Title as="h2">
          <span className={styles.number}>{number}</span>
          <Link href={permalink}>{principle.title}</Link>
        </Title>

        <Part label="The issue with the existing convention">
          <Text as="p">{principle.issue}</Text>
        </Part>

        <Part label="Our choice">
          <Text as="p" fontWeight="more">
            {principle.decision}
          </Text>
        </Part>

        <Part label="Why">
          <Stack gap="normal">
            {principle.why.map((paragraph) => (
              <Text as="p" key={paragraph}>
                {paragraph}
              </Text>
            ))}
          </Stack>
        </Part>

        <Part label="Example">
          <Demo />
        </Part>

        <Part label="What it costs">
          <Text as="p">{principle.cost}</Text>
        </Part>

        <Part label="Where to see it">
          <Text as="p" color="less">
            {principle.evidence}
          </Text>
        </Part>
      </Stack>
    </Card>
  );
}

export function Principles() {
  // The route's slug is scrolled to by the Router; the page itself is the whole list
  useRouter();

  return (
    <div className={styles.page}>
      <Stack gap="more" className={styles.section}>
        <Stack gap="normal" align="start" className={styles.heroText}>
          <Title as="h1" size="more">
            Principles
          </Title>
          <Text as="p" size="more" color="less">
            The decisions that run through every component, each with its reasons and what it costs.
          </Text>
        </Stack>
        {principles.map((principle, index) => (
          <PrincipleCard key={principle.slug} principle={principle} number={index + 1} />
        ))}
      </Stack>
    </div>
  );
}
