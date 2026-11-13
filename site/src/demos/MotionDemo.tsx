import { useState } from 'react';
import { Button, Chip, Stack, Toggle, useToast } from 'more-or-less-ui';
import { Cell } from './Cell';

export function MotionDemo() {
  const [isSelected, setIsSelected] = useState(false);
  const toast = useToast();

  return (
    <Stack gap="more">
      <Cell promise="Hover and press each one. They rise on a spring as the pointer arrives, settle without overshooting as it leaves, and shrink when pressed.">
        <Stack direction="row" gap="more" align="center" wrap>
          <Button>Button</Button>
          <Toggle label="Toggle" />
          <Chip isSelected={isSelected} onSelectedChange={setIsSelected}>
            Chip
          </Chip>
        </Stack>
      </Cell>

      <Cell promise="A toast enters on the same curve, and the stack glides when one goes. Turn on “reduce motion” in your system settings and all of this stops moving.">
        <Button
          background="less"
          onClick={() => toast.add({ title: 'Saved', description: 'Your changes are in.' })}
        >
          Show a toast
        </Button>
      </Cell>
    </Stack>
  );
}
