import { Button, Card, Stack, Text, Title } from 'more-or-less-ui';

export function App() {
  return (
    <Stack gap="more" padding="more">
      <Title>more-or-less-ui</Title>
      <Card padding="more">
        <Stack gap="normal">
          <Text>Scaffold check: the library is imported from the workspace.</Text>
          <Stack direction="row" gap="normal">
            <Button size="less">less</Button>
            <Button>normal</Button>
            <Button size="more">more</Button>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
