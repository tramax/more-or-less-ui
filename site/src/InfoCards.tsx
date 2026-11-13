import type { ReactNode } from 'react';
import { Card, Grid, Stack, Text, Title } from 'more-or-less-ui';

export interface InfoCardItem {
  key: string;
  title: ReactNode;
  text: ReactNode;
}

/** A row of short cards (a title and a sentence or two): every list of points on the home page. */
export function InfoCards({ items }: { items: InfoCardItem[] }) {
  return (
    <Grid columns={{ minWidth: '18rem' }} gap="more">
      {items.map((item) => (
        <Card key={item.key}>
          <Stack gap="normal">
            <Title as="h3" size="less">
              {item.title}
            </Title>
            <Text as="p" color="less">
              {item.text}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
