import type { ReactNode } from 'react';
import { Stack, Text, Title } from 'more-or-less-ui';
import styles from './site.module.css';

/** A section's heading and the short paragraph under it; `id` is what the section's `aria-labelledby` names. */
export function SectionIntro({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Stack gap="normal" className={styles.heroText}>
      <Title as="h2" id={id}>
        {title}
      </Title>
      <Text as="p">{children}</Text>
    </Stack>
  );
}
