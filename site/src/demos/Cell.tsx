import type { ReactNode } from 'react';
import { Stack, Text } from 'more-or-less-ui';

/** A thing to look at, with one line saying what to notice about it. Every demo's unit. */
export function Cell({ promise, children }: { promise: string; children: ReactNode }) {
  return (
    <Stack gap="normal" align="start">
      {children}
      <Text size="less" color="less">
        {promise}
      </Text>
    </Stack>
  );
}
