import { Button, Stack } from 'more-or-less-ui';
import { CodeBlock } from '../CodeBlock';
import { Cell } from './Cell';

// Decorative: the Button hides it from assistive technology, so the name below is what it announces
const TrashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
  </svg>
);

const SNIPPET = `// Each of these is a type error until it has a name:
<Button icon={<TrashIcon />} />
<Dialog>…</Dialog>
<TextField />

// Named, it compiles:
<Button icon={<TrashIcon />} aria-label="Delete file" />
<Dialog title="Delete this file?">…</Dialog>
<TextField label="Email" />`;

export function NamesDemo() {
  return (
    <Stack gap="more">
      <Cell promise="A screen reader announces “Delete file, button”. Without the name it would say only “button”.">
        <Button icon={<TrashIcon />} aria-label="Delete file" />
      </Cell>
      <CodeBlock code={SNIPPET} label="Components that need a name, and what happens without one" />
    </Stack>
  );
}
