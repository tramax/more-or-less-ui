import { useRef, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { showCode } from '../../../.storybook/snippet';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { TOAST_DEFAULTS, ToastProvider, useToast } from './ToastProvider';
import type { ToastOptions } from './Toast';

// A toast is fired, not rendered, so every story is a button that fires one
function Fire({ label = 'Show toast', ...options }: ToastOptions & { label?: string }) {
  const toast = useToast();
  return <Button onClick={() => toast.add(options)}>{label}</Button>;
}

const Row = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '2rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof ToastProvider> = {
  title: 'Overlays/Toast',
  component: ToastProvider,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: TOAST_DEFAULTS,
  parameters: {
    // Each story has its own provider and so its own viewport, fixed to a corner of the page. Inline on
    // the Docs page they would all sit in the same corner, on top of one another; in an iframe each has
    // a page (and a corner) of its own.
    docs: { story: { inline: false, iframeHeight: 360 } },
  },
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['top', 'bottom'],
      table: { defaultValue: { summary: TOAST_DEFAULTS.placement } },
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      table: { defaultValue: { summary: TOAST_DEFAULTS.align } },
    },
    limit: { table: { defaultValue: { summary: String(TOAST_DEFAULTS.limit) } } },
    duration: { table: { defaultValue: { summary: String(TOAST_DEFAULTS.duration) } } },
    children: { control: false },
  },
  // Every story needs the provider with the controls' values, and a row to put the button in
  render: (args, { parameters }) => (
    <ToastProvider {...args}>
      <Row>{parameters.fire}</Row>
    </ToastProvider>
  ),
};
export default meta;
type Story = StoryObj<typeof ToastProvider>;

/** Press the button. It goes after 5 seconds, and stays while the pointer or focus is on it. */
export const Default: Story = {
  parameters: {
    ...showCode(`const toast = useToast();

toast.add({ title: 'Saved', description: 'Draft 3 is up to date.' });`),
    fire: <Fire title="Saved" description="Draft 3 is up to date." />,
  },
};

/** Up to `limit` (3) show at once; the rest wait, and each starts its time when it shows. */
export const Stacking: Story = {
  parameters: {
    ...showCode(`for (let i = 1; i <= 5; i++) toast.add({ description: \`Message \${i}\` });`),
    fire: <FireMany />,
  },
};

function FireMany() {
  const toast = useToast();
  const count = useRef(0);
  return (
    <Button
      onClick={() => {
        for (let i = 0; i < 5; i++) toast.add({ description: `Message ${++count.current}` });
      }}
    >
      Show five
    </Button>
  );
}

/**
 * A toast with an `action` stays until it is dismissed: a message the person may need to act on must
 * not vanish under the pointer. Pass `duration` to give it a time anyway.
 */
export const WithAction: Story = {
  parameters: {
    ...showCode(`toast.add({
  description: 'Conversation archived.',
  action: <Button background="less">Undo</Button>,
});`),
    fire: (
      <Fire
        label="Archive"
        description="Conversation archived."
        action={<Button background="less">Undo</Button>}
      />
    ),
  },
};

/** `duration={0}` keeps it until the × is pressed. */
export const UntilDismissed: Story = {
  parameters: {
    ...showCode(
      `toast.add({ title: 'You are offline', description: 'Changes are saved here.', duration: 0 });`,
    ),
    fire: (
      <Fire
        title="You are offline"
        description="Changes are saved here."
        duration={0}
        label="Go offline"
      />
    ),
  },
};

/** `priority="high"` is read out at once, for an error. It looks the same: say what happened in the words. */
export const HighPriority: Story = {
  parameters: {
    ...showCode(
      `toast.add({ title: 'Upload failed', description: 'The file is too large.', priority: 'high' });`,
    ),
    fire: (
      <Fire
        title="Upload failed"
        description="The file is too large."
        priority="high"
        label="Fail"
      />
    ),
  },
};

/** `add` returns an id; `update` changes the toast in place and starts its time again. */
export const Updating: Story = {
  parameters: {
    ...showCode(`const id = toast.add({ title: 'Saving…', duration: 0 });
await save();
toast.update(id, { title: 'Saved', duration: 3000 });`),
    fire: <FireUpdating />,
  },
};

function FireUpdating() {
  const toast = useToast();
  return (
    <Button
      onClick={() => {
        const id = toast.add({ title: 'Saving…', duration: 0 });
        window.setTimeout(() => toast.update(id, { title: 'Saved', duration: 3000 }), 1500);
      }}
    >
      Save
    </Button>
  );
}

/** `size` is the font size, and the padding and the gaps follow it. */
export const Size: Story = {
  parameters: {
    ...showCode(
      `<Fire size="less" /> <Fire size="normal" /> <Fire size="more" /> <Fire size="1.25rem" />`,
    ),
    fire: (
      <>
        <Fire label="less" size="less" title="Size less" description="Quieter and smaller." />
        <Fire label="normal" size="normal" title="Size normal" description="The default." />
        <Fire label="more" size="more" title="Size more" description="Larger and roomier." />
        <Fire label="1.25rem" size="1.25rem" description="Any CSS size." />
      </>
    ),
  },
};

/**
 * Everything outside a modal dialog is inert, so a toast on the page could not be pressed. While a dialog
 * is open the toasts show inside it: press the button in the dialog, then the × on the toast.
 */
export const InsideDialog: Story = {
  parameters: {
    ...showCode(`<ToastProvider>
  <Dialog title="Rename file" trigger={<Button>Rename</Button>}>
    <Button onClick={() => toast.add({ description: 'Renamed.', action: <Button>Undo</Button> })}>Save</Button>
  </Dialog>
</ToastProvider>`),
    fire: (
      <Dialog title="Rename file" trigger={<Button>Open dialog</Button>}>
        <Stack gap="more">
          <Text as="p">Toasts fired now show inside this dialog and can be pressed.</Text>
          <Fire
            label="Save"
            description="Renamed."
            action={<Button background="less">Undo</Button>}
          />
        </Stack>
      </Dialog>
    ),
  },
};
