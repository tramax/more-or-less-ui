import { useState } from 'react';
import { Button, Chip, Collapsible, Grid, Stack, Text, TextField, Toggle } from 'more-or-less-ui';
import { Cell } from './Cell';

/**
 * Things that look like what they do. Every control is live: a chip that looks removable removes, a
 * toggle that looks flippable flips. The captions are what each look promises.
 */
export function AffordanceDemo() {
  const [isSelected, setIsSelected] = useState(false);
  const [removable, setRemovable] = useState(['Design', 'Research']);

  return (
    <Grid columns={{ minWidth: '16rem' }} gap="more">
      <Cell promise="Outlined: information. Nothing happens if you press it.">
        <Chip>Beta</Chip>
      </Cell>

      <Cell promise="Filled, with a ×: a value you can take out.">
        <Stack direction="row" gap="less" align="center" wrap>
          {removable.map((label) => (
            <Chip
              key={label}
              onRemove={() => setRemovable((all) => all.filter((l) => l !== label))}
            >
              {label}
            </Chip>
          ))}
          {removable.length === 0 && (
            <Button
              size="less"
              background="less"
              onClick={() => setRemovable(['Design', 'Research'])}
            >
              Reset
            </Button>
          )}
        </Stack>
      </Cell>

      <Cell promise="Filled, and a tick when on: a choice you can switch.">
        <Chip isSelected={isSelected} onSelectedChange={setIsSelected}>
          Remote
        </Chip>
      </Cell>

      <Cell promise="Plain text: no fill, so no invitation to type.">
        <TextField label="Name" defaultValue="Ada Lovelace" isReadOnly />
      </Cell>

      <Cell promise="A fill and a thumb: on or off by position, fill and icon, not color alone.">
        <Toggle label="Notifications" defaultChecked />
      </Cell>

      <Cell promise="Filled while closed, so a collapsed section doesn’t look empty.">
        <Collapsible title="Advanced settings">
          <Text as="p">Nothing here yet.</Text>
        </Collapsible>
      </Cell>
    </Grid>
  );
}
