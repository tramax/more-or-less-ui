import type { ReactNode } from 'react';
import { Stack, Text } from 'more-or-less-ui';
import styles from './site.module.css';

/** One part of an argument: a small label above its text (a principle's card, the home page's reasons). */
export function Part({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap="less">
      <Text size="less" color="less" fontWeight="more" className={styles.demoLabel}>
        {label}
      </Text>
      {children}
    </Stack>
  );
}
