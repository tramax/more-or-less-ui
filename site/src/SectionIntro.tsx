import type { ReactNode } from 'react';
import { Stack, Text, Title } from 'more-or-less-ui';

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
    <Stack gap="normal">
      <Title as="h2" id={id}>
        {title}
      </Title>
      <Text as="p">{children}</Text>
    </Stack>
  );
}
