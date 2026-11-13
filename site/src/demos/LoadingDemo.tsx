import { useState } from 'react';
import { Avatar, Card, Stack, Text, Toggle } from 'more-or-less-ui';
import { CodeBlock } from '../CodeBlock';
import { Cell } from './Cell';

const SNIPPET = `<Stack aria-busy={isLoading}>
  <Avatar
    isTextShown
    name={user?.name ?? 'Loading name'}
    description={user?.role ?? 'Loading role'}
  />
  <Text as="p">{user?.bio ?? 'A placeholder about as long as the real bio'}</Text>
</Stack>`;

/** The real components, with placeholder content, inside a region that says it is busy. */
export function LoadingDemo() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Stack gap="more">
      <Cell promise="Switch it. The same Avatar and Text become blocks, so the layout and the height are the real ones.">
        <Toggle label="Loading" checked={isLoading} onChange={setIsLoading} />
      </Cell>
      <Card>
        <Stack gap="normal" aria-busy={isLoading}>
          <Avatar
            isTextShown
            name={isLoading ? 'Loading name' : 'Ada Lovelace'}
            description={isLoading ? 'Loading role' : 'Mathematician'}
          />
          <Text as="p">
            {isLoading
              ? 'A placeholder about as long as the real bio goes here, and wraps like it.'
              : 'Wrote what is often called the first computer program, in 1843, for a machine that was never built.'}
          </Text>
        </Stack>
      </Card>
      <CodeBlock code={SNIPPET} label="A region that is loading" />
    </Stack>
  );
}
