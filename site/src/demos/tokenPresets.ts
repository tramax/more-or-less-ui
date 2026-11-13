/**
 * What each control in the customiser sets: a few presets of the library's main tokens. The first preset of
 * a control is the library's own look and sets nothing. Adding a control is adding an entry here.
 */
export type Preset = { value: string; label: string; vars: Record<string, string> };
export type TokenControl = { key: string; label: string; tooltip: string; presets: Preset[] };

const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// Two layers each, in the same order as the library's: a hover transition interpolates per layer
const shadow = (near: number, far: number, offset: number, blur: number) =>
  `0 ${offset / 2}px ${offset}px color-mix(in oklab, var(--shadow-color) ${near}%, transparent), 0 ${offset * 2}px ${blur}px color-mix(in oklab, var(--shadow-color) ${far}%, transparent)`;

export const TOKEN_CONTROLS: TokenControl[] = [
  {
    key: 'radius',
    label: 'Corners',
    tooltip: 'Sets --radius-less, --radius-normal and --radius-more.',
    presets: [
      { value: 'default', label: 'Default', vars: {} },
      {
        value: 'sharp',
        label: 'Sharp',
        vars: { '--radius-less': '0', '--radius-normal': '0.25rem', '--radius-more': '0.5rem' },
      },
      {
        value: 'round',
        label: 'Round',
        vars: { '--radius-less': '2rem', '--radius-normal': '3.5rem', '--radius-more': '5rem' },
      },
    ],
  },
  {
    key: 'size',
    label: 'Text size',
    tooltip:
      'Sets --size-less, --size-normal and --size-more. The body text, buttons and fields follow.',
    presets: [
      { value: 'default', label: 'Default', vars: {} },
      {
        value: 'small',
        label: 'Small',
        vars: { '--size-less': '0.75rem', '--size-normal': '0.875rem', '--size-more': '1.125rem' },
      },
      {
        value: 'large',
        label: 'Large',
        vars: { '--size-less': '1rem', '--size-normal': '1.125rem', '--size-more': '1.5rem' },
      },
    ],
  },
  {
    key: 'space',
    label: 'Spacing',
    tooltip: 'Sets --space-less, --space-normal and --space-more: the padding and the gaps.',
    presets: [
      { value: 'default', label: 'Default', vars: {} },
      {
        value: 'dense',
        label: 'Dense',
        vars: { '--space-less': '0.25rem', '--space-normal': '0.5rem', '--space-more': '1rem' },
      },
      {
        value: 'roomy',
        label: 'Roomy',
        vars: { '--space-less': '0.75rem', '--space-normal': '1.5rem', '--space-more': '2rem' },
      },
    ],
  },
  {
    key: 'font',
    label: 'Typeface',
    tooltip: 'Sets --font-family-body. Every component inherits it.',
    presets: [
      { value: 'default', label: 'System', vars: {} },
      { value: 'serif', label: 'Serif', vars: { '--font-family-body': SERIF } },
      { value: 'mono', label: 'Mono', vars: { '--font-family-body': MONO } },
    ],
  },
  {
    key: 'elevation',
    label: 'Shadows',
    tooltip: 'Sets --elevation-less, --elevation-normal and --elevation-more.',
    presets: [
      { value: 'default', label: 'Default', vars: {} },
      {
        value: 'flat',
        label: 'Flat',
        vars: {
          '--elevation-less': 'none',
          '--elevation-normal': 'none',
          '--elevation-more': 'none',
        },
      },
      {
        value: 'deep',
        label: 'Deep',
        vars: {
          '--elevation-less': shadow(12, 8, 4, 10),
          '--elevation-normal': shadow(14, 12, 8, 24),
          '--elevation-more': shadow(16, 18, 16, 48),
        },
      },
    ],
  },
  {
    key: 'motion',
    label: 'Motion',
    tooltip: 'Sets --ease-enter and --ease-pop. Springy overshoots and settles; calm just arrives.',
    presets: [
      { value: 'default', label: 'Springy', vars: {} },
      {
        value: 'calm',
        label: 'Calm',
        vars: {
          '--ease-enter': 'cubic-bezier(0.22, 1, 0.36, 1)',
          '--ease-pop': 'cubic-bezier(0.22, 1, 0.36, 1)',
          '--scale-icon-hover': '1.1',
        },
      },
    ],
  },
];
