import type { ReactElement } from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { Checkbox } from '../Checkbox';
import { DateField } from '../DateField';
import { DatePicker } from '../DatePicker';
import { FileUpload } from '../FileUpload';
import { Radio } from '../Radio';
import { SegmentedControl } from '../SegmentedControl';
import { Select } from '../Select';
import { Slider } from '../Slider';
import { Textarea } from '../Textarea';
import { TextField } from '../TextField';

// Every input that takes a visible `label` takes a `tooltip` too, through its frame (TextFieldFrame,
// OptionGroupFrame) into FieldLabel. FieldLabel.test.tsx covers the label; this covers the wiring in each.
const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];

const FIELDS: [string, (tooltip?: string) => ReactElement][] = [
  ['TextField', (tooltip) => <TextField label="Name" tooltip={tooltip} />],
  ['Textarea', (tooltip) => <Textarea label="Name" tooltip={tooltip} />],
  ['Select', (tooltip) => <Select label="Name" options={OPTIONS} tooltip={tooltip} />],
  ['Slider', (tooltip) => <Slider label="Name" tooltip={tooltip} />],
  ['FileUpload', (tooltip) => <FileUpload label="Name" tooltip={tooltip} />],
  ['DateField', (tooltip) => <DateField label="Name" tooltip={tooltip} />],
  ['DatePicker', (tooltip) => <DatePicker label="Name" tooltip={tooltip} />],
  ['Checkbox', (tooltip) => <Checkbox label="Name" options={OPTIONS} tooltip={tooltip} />],
  ['Radio', (tooltip) => <Radio label="Name" options={OPTIONS} tooltip={tooltip} />],
  [
    'SegmentedControl',
    (tooltip) => <SegmentedControl label="Name" options={OPTIONS} tooltip={tooltip} />,
  ],
];

afterEach(cleanup);

describe('tooltip on a labelled input', () => {
  it.each(FIELDS)('%s: an ⓘ button beside the label shows the text on focus', (_name, field) => {
    render(field('What this is'));
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    act(() => {
      screen.getByRole('button', { name: 'About Name' }).focus();
    });
    expect(screen.getByRole('tooltip', { hidden: true }).textContent).toBe('What this is');
  });

  it.each(FIELDS)('%s: no button without one', (_name, field) => {
    render(field());
    expect(screen.queryByRole('button', { name: 'About Name' })).toBeNull();
  });
});
