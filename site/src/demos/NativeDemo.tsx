import { useState } from 'react';
import { Button, Dialog, Grid, Slider } from 'more-or-less-ui';
import { Cell } from './Cell';

export function NativeDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Grid columns={{ minWidth: '20rem' }} gap="more">
      <Cell promise="A native <dialog>. Escape closes it, Tab stays inside it, and the page behind can’t be reached.">
        <Button onClick={() => setIsOpen(true)}>Open a dialog</Button>
        <Dialog
          title="Delete this file?"
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          actions={
            <>
              <Button background="less" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button background="more" onClick={() => setIsOpen(false)}>
                Delete
              </Button>
            </>
          }
        >
          This can’t be undone.
        </Dialog>
      </Cell>

      <Cell promise="A native range input, drawn over. Arrow keys, Home and End work, and it submits with a form.">
        <Slider label="Volume" min={0} max={100} defaultValue={40} />
      </Cell>
    </Grid>
  );
}
