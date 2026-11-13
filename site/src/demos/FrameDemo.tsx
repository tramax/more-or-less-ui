import { useState } from 'react';
import {
  DateField,
  FileUpload,
  Grid,
  Select,
  Slider,
  Stack,
  TextField,
  Textarea,
  Toggle,
} from 'more-or-less-ui';
import { Cell } from './Cell';

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
];

/** Six different controls, one frame: each draws its own control and gets the rest from it. */
export function FrameDemo() {
  const [hasErrors, setHasErrors] = useState(false);
  const error = hasErrors ? 'This field is required' : undefined;

  return (
    <Stack gap="more">
      <Cell promise="Switch the errors on. Six controls, one label, one error message, one set of ids, and they say it the same way.">
        <Toggle label="Show an error on every field" checked={hasErrors} onChange={setHasErrors} />
      </Cell>
      <Grid columns={{ minWidth: '18rem' }} gap="more">
        <TextField label="Name" error={error} tooltip="As on your passport." />
        <Textarea label="About you" error={error} tooltip="A sentence or two." />
        <Select label="Plan" options={PLANS} error={error} tooltip="You can change it later." />
        <Slider label="Volume" error={error} tooltip="Louder is not better." />
        <DateField label="Birthday" error={error} tooltip="Day, month, year." />
        <FileUpload label="Attachment" error={error} tooltip="A PDF or an image." />
      </Grid>
    </Stack>
  );
}
