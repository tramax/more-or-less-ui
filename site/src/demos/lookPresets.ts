import type { Preset } from './tokenPresets';

/**
 * Whole looks for the customiser: each one sets dozens of the library's variables at once (the three
 * scales, both typefaces, the shadows, the motion and most of the colors) to show how far the same
 * components go with nothing but CSS variables. Where the single controls in `tokenPresets.ts` change
 * one thing, a look is a complete answer to "what if the library were this?".
 *
 * The first look is the library's own and sets nothing. A look's colors are written from `Canvas`,
 * `CanvasText` and `--color-primary`, never from a fixed light or dark value, so it holds in the site's
 * light and dark themes alike. The exceptions are Terminal (dark) and Retro (light), which are one theme
 * on purpose and say so with `color-scheme`. Retro also sets every variable the library defines, which a
 * test keeps true as tokens are added.
 *
 * A look that needs a typeface the visitor does not have names it in `fonts`: a Google Fonts stylesheet,
 * which the customiser loads only once the look is chosen, so the page asks Google for nothing until then.
 * The family stays first in the look's font stack, with a system face behind it for the moment before it
 * arrives (`display=swap` in the URL shows the fallback first, then swaps).
 */
export type Look = Preset & { description: string; fonts?: string };

/** The three values of a less / normal / more scale, as the three variables of that name. */
const scale = (name: string, less: string, normal: string, more: string) => ({
  [`--${name}-less`]: less,
  [`--${name}-normal`]: normal,
  [`--${name}-more`]: more,
});

/** `color` at `percent` over nothing: the way the library writes a faint tint */
const fade = (color: string, percent: number) =>
  `color-mix(in oklab, ${color} ${percent}%, transparent)`;

/** `color` at `percent` over `base`: an opaque tint, for a surface that must not show what is behind it */
const over = (color: string, percent: number, base = 'Canvas') =>
  `color-mix(in oklab, ${color} ${percent}%, ${base})`;

/** A one-pixel outline in the text color, the layer that stands in for a border */
const ring = (percent: number) => `0 0 0 1px ${fade('CanvasText', percent)}`;

/** A shadow is two layers; keep the count, because a hover transition interpolates layer by layer */
const layers = (first: string, second: string) => `${first}, ${second}`;

/**
 * Every place the library fills something with the brand color and writes text on it: Button, Card,
 * Banner, a selected Chip, the current page and day, the active date segment, the segmented thumb. The
 * light theme fills them with `--color-primary` and the dark theme with a deeper one; a look that wants
 * one fill in both themes sets them all, here.
 */
const filled = (fill: string, text: string) => ({
  '--color-card-background-more': fill,
  '--color-button-background-more': fill,
  '--color-button-text-more': text,
  '--color-banner-background-more': fill,
  '--color-banner-text-more': text,
  '--color-chip-background-selected': fill,
  '--color-chip-text-selected': text,
  '--color-pagination-background-current': fill,
  '--color-pagination-text-current': text,
  '--color-calendar-background-current': fill,
  '--color-calendar-text-current': text,
  '--color-datefield-segment-background-active': fill,
  '--color-datefield-segment-text-active': text,
  '--color-segmented-thumb': fill,
  '--color-segmented-text-selected': text,
});

/** The shared field fill and its hover. Checkbox, Radio, Toggle, Slider, Select and the rest alias them. */
const fieldFills = (base: string, hover: string) => ({
  '--color-field-background': base,
  '--color-field-background-hover': hover,
});

const GROTESK = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";
const HEAVY = "'Arial Black', 'Helvetica Neue', Impact, sans-serif";
// A rounded system face stands in until Fredoka arrives
const FREDOKA = "Fredoka, ui-rounded, 'SF Pro Rounded', 'Trebuchet MS', system-ui, sans-serif";
// Two pixel faces, each one weight: DotGothic16 for text, Jersey 15 for headings, with the system's
// bitmap-era faces behind them. (Pixelify Sans was tried: its "fi" and "fl" ligatures draw stray glyphs.)
const PIXEL_TEXT = 'DotGothic16, Tahoma, Verdana, sans-serif';
const PIXEL_TITLE = "'Jersey 15', DotGothic16, Tahoma, Verdana, sans-serif";
const LEXEND = "Lexend, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const FRAUNCES = "Fraunces, Georgia, 'Times New Roman', serif";
const DM_SANS = "'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, 'Cascadia Code', SFMono-Regular, Menlo, Consolas, monospace";

// A calm curve for everything that moves: it arrives and stops, with no overshoot
const CALM = 'cubic-bezier(0.22, 1, 0.36, 1)';

const SLATE: Look = {
  value: 'slate',
  label: 'Slate',
  description:
    'A dense work tool: small type, tight spacing, grey fills and borders, and one blue for what matters.',
  vars: {
    '--color-primary': '#3b6fd4',
    '--color-danger': '#d1242f',

    // Type: small and plain, with headings that are bold rather than big
    ...scale('size', '0.75rem', '0.8125rem', '1rem'),
    ...scale('weight', '400', '400', '600'),
    '--size-title-less': '0.875rem',
    '--size-title-normal': '1.125rem',
    '--size-title-more': 'clamp(1.5rem, 1rem + 1.5vw, 2rem)',
    '--weight-title-less': '600',
    '--weight-title-normal': '600',
    '--weight-title-more': '700',
    '--line-height-title': '1.25',

    // Tight and square
    ...scale('radius', '0.125rem', '0.25rem', '0.375rem'),
    ...scale('space', '0.25rem', '0.5rem', '0.875rem'),

    // A one-pixel border does what a shadow does elsewhere
    '--elevation-less': layers(ring(14), `0 1px 2px ${fade('CanvasText', 4)}`),
    '--elevation-normal': layers(ring(14), `0 2px 4px ${fade('CanvasText', 6)}`),
    '--elevation-more': layers(ring(14), `0 8px 24px ${fade('CanvasText', 12)}`),

    // Quick and exact
    '--ease-enter': 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    '--ease-pop': 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    '--scale-icon-hover': '1.1',

    // Neutral grey fills in place of the brand tint, so the blue is left for the one thing that is chosen
    ...fieldFills(fade('CanvasText', 6), fade('CanvasText', 11)),
    '--color-button-background-normal': over('CanvasText', 9),
    '--color-text-less': fade('CanvasText', 58),
    '--color-line': fade('CanvasText', 14),
    '--color-progress-track': fade('CanvasText', 12),
    '--color-placeholder': fade('CanvasText', 10),
    '--color-avatar-lightness': '0.88',
    '--color-avatar-chroma': '0.03',
    '--color-overlay-background': fade('Canvas', 92),
    '--color-modal-background': fade('Canvas', 96),
    '--color-modal-backdrop': fade('CanvasText', 30),
  },
};

const BRUTAL: Look = {
  value: 'brutal',
  label: 'Brutal',
  description:
    'Hard edges: no radius, black outlines with offset shadows, heavy type and a flat yellow, in either theme.',
  vars: {
    '--color-primary': '#ffd60a',
    '--color-danger': '#e5261b',

    // Type: a grotesque for the text and a heavy face for the headings
    '--font-family-body': GROTESK,
    '--font-family-title': HEAVY,
    ...scale('size', '0.9375rem', '1.0625rem', '1.375rem'),
    ...scale('weight', '400', '600', '800'),
    '--size-title-less': '1.25rem',
    '--size-title-normal': '1.75rem',
    '--size-title-more': 'clamp(2.5rem, 1.5rem + 4vw, 4.5rem)',
    '--weight-title-less': '800',
    '--weight-title-normal': '900',
    '--weight-title-more': '900',
    '--line-height-title': '1.05',

    ...scale('radius', '0', '0', '0'),
    ...scale('space', '0.5rem', '1.125rem', '1.75rem'),

    // An outline and a hard offset block, both in the text color, so they flip with the theme
    '--elevation-less': layers('0 0 0 2px CanvasText', '2px 2px 0 2px CanvasText'),
    '--elevation-normal': layers('0 0 0 2px CanvasText', '4px 4px 0 2px CanvasText'),
    '--elevation-more': layers('0 0 0 2px CanvasText', '8px 8px 0 2px CanvasText'),

    // Straight to the point
    '--ease-enter': 'cubic-bezier(0.16, 1, 0.3, 1)',
    '--ease-pop': 'cubic-bezier(0.16, 1, 0.3, 1)',
    '--ease-leave': 'cubic-bezier(0.7, 0, 0.84, 0)',
    '--scale-icon-hover': '1.2',

    // Yellow with black on it in both themes, solid fills that hide what is behind, rules in full black
    ...filled('var(--color-primary)', '#000'),
    ...fieldFills(over('var(--color-primary)', 35), over('var(--color-primary)', 60)),
    '--color-field-background-error': over('var(--color-danger)', 35),
    '--color-field-background-error-hover': over('var(--color-danger)', 60),
    '--color-button-edge': 'transparent',
    '--color-text-less': fade('CanvasText', 70),
    '--color-line': 'CanvasText',
    '--color-progress-track': over('CanvasText', 12),
    '--color-chip-border': 'CanvasText',
    '--color-chip-hover': fade('CanvasText', 10),
    '--color-chip-pressed': fade('CanvasText', 20),
    '--color-indicator-background': 'CanvasText',
    '--color-placeholder': fade('CanvasText', 14),
    '--color-avatar-lightness': '0.88',
    '--color-avatar-chroma': '0.16',
    '--color-overlay-background': 'Canvas',
    '--color-modal-background': 'Canvas',
    '--color-modal-backdrop': fade('CanvasText', 45),
  },
};

const CANDY: Look = {
  value: 'candy',
  label: 'Candy',
  fonts: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap',
  description:
    'Soft and pastel: Fredoka, a pale blossom pink, big round corners, shadows that are a blush rather than an edge, and a gentle bounce.',
  vars: {
    '--color-primary': '#f6a6c9',
    '--color-danger': '#d9455f',

    // Type: Fredoka, a rounded face, a size up, and a lighter hand than the library's bold
    '--font-family-body': FREDOKA,
    ...scale('size', '1rem', '1.125rem', '1.5rem'),
    ...scale('weight', '400', '500', '700'),
    '--size-title-less': '1.25rem',
    '--size-title-normal': '1.75rem',
    '--size-title-more': 'clamp(2.25rem, 1.25rem + 3.5vw, 3.75rem)',
    '--weight-title-less': '500',
    '--weight-title-normal': '600',
    '--weight-title-more': '700',
    '--line-height-title': '1.15',

    ...scale('radius', '1rem', '1.75rem', '2.75rem'),
    ...scale('space', '0.625rem', '1.25rem', '1.75rem'),

    // A blush: no hard edge, two wide soft layers, tinted plum rather than black so it stays pink
    '--shadow-color': 'color-mix(in oklab, var(--color-primary), #4a2040 55%)',
    '--elevation-less': layers(
      `0 2px 6px ${fade('var(--shadow-color)', 10)}`,
      `0 6px 16px ${fade('var(--shadow-color)', 8)}`,
    ),
    '--elevation-normal': layers(
      `0 3px 8px ${fade('var(--shadow-color)', 11)}`,
      `0 12px 28px ${fade('var(--shadow-color)', 10)}`,
    ),
    '--elevation-more': layers(
      `0 6px 14px ${fade('var(--shadow-color)', 12)}`,
      `0 22px 44px ${fade('var(--shadow-color)', 14)}`,
    ),

    // A gentle overshoot, and an icon that swells a little when you reach for it
    '--ease-enter': 'cubic-bezier(0.34, 2.2, 0.64, 1)',
    '--ease-pop': 'cubic-bezier(0.3, 1.9, 0.5, 1)',
    '--scale-icon-hover': '1.4',

    // Pale pink surfaces. The pastel brand is light, so the fills step up to keep fields visible.
    '--color-card-background-normal': over('var(--color-primary)', 8),
    ...fieldFills(fade('var(--color-primary)', 24), fade('var(--color-primary)', 40)),
    '--color-button-edge': fade('white', 70),
    '--color-text-less': fade('CanvasText', 58),
    '--color-line': fade('var(--color-primary)', 50),
    '--color-progress-track': fade('var(--color-primary)', 30),
    '--color-chip-hover': fade('var(--color-primary)', 18),
    '--color-chip-pressed': fade('var(--color-primary)', 32),
    '--color-placeholder': fade('var(--color-primary)', 30),
    '--color-avatar-lightness': '0.88',
    '--color-avatar-chroma': '0.08',
    '--color-overlay-background': fade(over('var(--color-primary)', 10), 80),
    '--color-modal-backdrop': fade('var(--color-primary)', 22),
  },
};

const TERMINAL: Look = {
  value: 'terminal',
  label: 'Terminal',
  description:
    'Always dark: monospace, outlines that glow, one neon green. The theme toggle has no say in this one.',
  vars: {
    // The one look that is not theme-neutral: it sets the page dark itself, and every fill it needs
    'color-scheme': 'dark',
    '--color-primary': '#3dffa2',
    '--color-danger': '#ff6b6b',

    // Type: monospace throughout, small, and a regular weight for headings
    '--font-family-body': MONO,
    ...scale('size', '0.8125rem', '0.9375rem', '1.125rem'),
    ...scale('weight', '400', '400', '700'),
    '--size-title-less': '1rem',
    '--size-title-normal': '1.375rem',
    '--size-title-more': 'clamp(1.75rem, 1rem + 3vw, 3rem)',
    '--weight-title-less': '400',
    '--weight-title-normal': '600',
    '--weight-title-more': '700',
    '--line-height-title': '1.25',

    ...scale('radius', '0', '0.125rem', '0.25rem'),
    ...scale('space', '0.375rem', '0.75rem', '1.25rem'),

    // A shadow cannot be seen on black, so a one-pixel outline and a glow, both in the brand color
    '--elevation-less': layers(
      `0 0 0 1px ${fade('var(--color-primary)', 35)}`,
      `0 0 8px ${fade('var(--color-primary)', 10)}`,
    ),
    '--elevation-normal': layers(
      `0 0 0 1px ${fade('var(--color-primary)', 45)}`,
      `0 0 16px ${fade('var(--color-primary)', 16)}`,
    ),
    '--elevation-more': layers(
      `0 0 0 1px ${fade('var(--color-primary)', 60)}`,
      `0 0 32px ${fade('var(--color-primary)', 24)}`,
    ),

    // Crisp, no overshoot
    '--ease-enter': 'cubic-bezier(0.2, 0, 0, 1)',
    '--ease-pop': 'cubic-bezier(0.2, 0, 0, 1)',
    '--scale-icon-hover': '1.15',

    // Neon on black with black on the neon, faint green fills, rules and tracks in the same green
    ...filled('var(--color-primary)', '#000'),
    '--color-card-background-normal': over('var(--color-primary)', 5),
    ...fieldFills(fade('var(--color-primary)', 10), fade('var(--color-primary)', 18)),
    '--color-text-less': fade('CanvasText', 55),
    '--color-line': fade('var(--color-primary)', 30),
    '--color-progress-track': fade('var(--color-primary)', 16),
    '--color-placeholder': fade('var(--color-primary)', 16),
    '--color-avatar-lightness': '0.45',
    '--color-avatar-chroma': '0.1',
    '--color-overlay-background': fade('Canvas', 80),
    '--color-modal-background': fade('Canvas', 88),
    '--color-modal-backdrop': 'oklch(0 0 0 / 60%)',
  },
};

const LEXEND_LOOK: Look = {
  value: 'lexend',
  label: 'Lexend',
  fonts: 'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;700&display=swap',
  description:
    'Made to be read: Lexend, a typeface designed for reading ease, with larger text, roomy spacing, soft corners and a calm teal.',
  vars: {
    '--color-primary': '#0e9aa7',
    '--color-danger': '#c93a3a',

    // Type: one family for text and headings, a step larger than the library's, with light and semibold
    '--font-family-body': LEXEND,
    ...scale('size', '0.9375rem', '1.0625rem', '1.375rem'),
    ...scale('weight', '300', '400', '600'),
    '--size-title-less': '1.25rem',
    '--size-title-normal': '1.75rem',
    '--size-title-more': 'clamp(2.25rem, 1.25rem + 3.5vw, 3.75rem)',
    '--weight-title-less': '400',
    '--weight-title-normal': '600',
    '--weight-title-more': '700',
    '--line-height-title': '1.25',

    // Room to breathe: Lexend is wide, so the spacing goes up with it
    ...scale('radius', '0.5rem', '0.875rem', '1.375rem'),
    ...scale('space', '0.75rem', '1.5rem', '2.25rem'),

    // Wide, soft and faintly teal shadows
    '--shadow-color': 'color-mix(in oklab, var(--color-primary), black 65%)',
    '--elevation-less': layers(
      `0 1px 3px ${fade('var(--shadow-color)', 8)}`,
      `0 4px 12px ${fade('var(--shadow-color)', 6)}`,
    ),
    '--elevation-normal': layers(
      `0 2px 6px ${fade('var(--shadow-color)', 9)}`,
      `0 12px 28px ${fade('var(--shadow-color)', 9)}`,
    ),
    '--elevation-more': layers(
      `0 4px 12px ${fade('var(--shadow-color)', 10)}`,
      `0 24px 48px ${fade('var(--shadow-color)', 14)}`,
    ),

    '--ease-enter': 'cubic-bezier(0.25, 1.4, 0.5, 1)',
    '--ease-pop': 'cubic-bezier(0.25, 1.3, 0.5, 1)',
    '--scale-icon-hover': '1.2',

    // Teal-tinted fields, and secondary text that is easy to tell from the primary
    ...fieldFills(fade('var(--color-primary)', 12), fade('var(--color-primary)', 22)),
    '--color-card-background-normal': over('var(--color-primary)', 3),
    '--color-text-less': fade('CanvasText', 62),
    '--color-line': fade('var(--color-primary)', 30),
    '--color-progress-track': fade('var(--color-primary)', 18),
    '--color-placeholder': fade('var(--color-primary)', 18),
    '--color-avatar-lightness': '0.84',
    '--color-avatar-chroma': '0.07',
    '--color-overlay-background': fade('Canvas', 78),
    '--color-modal-backdrop': fade('CanvasText', 18),
  },
};

const MAGAZINE: Look = {
  value: 'magazine',
  label: 'Magazine',
  fonts:
    'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800&display=swap',
  description:
    'A serif for the headlines and a clean sans for the text: Fraunces over DM Sans, large bold titles, vermilion.',
  vars: {
    '--color-primary': '#e4572e',
    '--color-danger': '#b3261e',

    // Type: the contrast is the look. Fraunces for every Title, set big and heavy; DM Sans for all else
    '--font-family-body': DM_SANS,
    '--font-family-title': FRAUNCES,
    ...scale('size', '0.875rem', '1rem', '1.25rem'),
    ...scale('weight', '400', '400', '700'),
    '--size-title-less': '1.25rem',
    '--size-title-normal': '2rem',
    '--size-title-more': 'clamp(2.75rem, 1.5rem + 5vw, 5rem)',
    '--weight-title-less': '500',
    '--weight-title-normal': '700',
    '--weight-title-more': '800',
    '--line-height-title': '1.05',

    ...scale('radius', '0.375rem', '0.75rem', '1.25rem'),
    ...scale('space', '0.5rem', '1rem', '1.75rem'),

    // A clean lift, a little tighter than the library's
    '--elevation-less': layers(
      `0 1px 2px ${fade('CanvasText', 10)}`,
      `0 2px 6px ${fade('CanvasText', 6)}`,
    ),
    '--elevation-normal': layers(
      `0 2px 4px ${fade('CanvasText', 10)}`,
      `0 8px 20px ${fade('CanvasText', 9)}`,
    ),
    '--elevation-more': layers(
      `0 4px 8px ${fade('CanvasText', 12)}`,
      `0 18px 40px ${fade('CanvasText', 14)}`,
    ),

    '--ease-enter': CALM,
    '--ease-pop': 'cubic-bezier(0.3, 1.8, 0.5, 1)',

    // Warm, light fills; the vermilion is used where it counts
    ...fieldFills(fade('var(--color-primary)', 10), fade('var(--color-primary)', 19)),
    '--color-card-background-normal': over('var(--color-primary)', 4),
    '--color-text-less': fade('CanvasText', 60),
    '--color-line': fade('CanvasText', 16),
    '--color-progress-track': fade('var(--color-primary)', 16),
    '--color-placeholder': fade('var(--color-primary)', 16),
    '--color-avatar-lightness': '0.85',
    '--color-avatar-chroma': '0.09',
    '--color-modal-backdrop': fade('CanvasText', 22),
  },
};

/**
 * Every variable in tokens.css and themes.css, set: the one look that leaves nothing to the library. A
 * grey window-and-bevel system from the 1990s, which is as far from the others as the same components
 * go: no radius, light and shadow drawn as one-pixel bevels, and pixel typefaces. Its motion is plain on
 * purpose: a look that animated in steps would only look like a slow page. Because it sets every color,
 * it is written in fixed values
 * and sets `color-scheme: light`: it is one theme, and the site's theme toggle has no say in it.
 */
const RETRO: Look = (() => {
  const FACE = '#c0c0c0'; // the grey of every window and button
  const WHITE = '#ffffff';
  const GREY = '#808080'; // the shadowed edge of a bevel, and a sunken track
  const BLACK = '#0a0a0a';
  const NAVY = '#000080'; // title bars and whatever is selected
  const TEAL = '#008080'; // the desktop behind a window
  const SELECTION = '#a8a8e8'; // a row under the pointer: light, because the text on it stays black
  const FIELD_ERROR = '#ffd0d0';
  const FIELD_ERROR_HOVER = '#ffbcbc';
  const FIELD_HOVER = '#eeeeff';
  const RAISED = (width: number, edge: string) =>
    layers(`inset ${width}px ${width}px 0 ${WHITE}`, `inset -${width}px -${width}px 0 ${edge}`);
  const VEIL = fade(TEAL, 55);
  // Quick and plain: the same smooth curve in and out. Stepped easing would read as a dropped frame rate,
  // and a theme should never look slower than the library it restyles.
  const QUICK = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  return {
    value: 'retro',
    label: 'Retro',
    fonts: 'https://fonts.googleapis.com/css2?family=DotGothic16&family=Jersey+15&display=swap',
    description:
      'Every variable set: bevelled grey windows, pixel type, navy where you have chosen, quick plain motion. Always light.',
    vars: {
      'color-scheme': 'light',

      // Type: pixel faces with one weight each, so no weight is asked for that would be faked, and sizes
      // that are whole multiples of the pixel grid (16 and 24px; 15, 30 and 60px for the headings)
      '--font-family-body': PIXEL_TEXT,
      '--font-family-title': PIXEL_TITLE,
      ...scale('size', '1rem', '1.125rem', '1.5rem'),
      ...scale('weight', '400', '400', '400'),
      '--size-title-less': '1.25rem',
      '--size-title-normal': '1.875rem',
      '--size-title-more': 'clamp(2.25rem, 1.25rem + 3vw, 3.75rem)',
      '--weight-title-less': '400',
      '--weight-title-normal': '400',
      '--weight-title-more': '400',
      '--line-height-title': '1.1',

      // Square, and close together
      ...scale('radius', '0', '0', '0'),
      ...scale('space', '0.375rem', '0.75rem', '1.25rem'),

      // Quick and plain motion, and an icon that does not swell
      '--ease-enter': QUICK,
      '--ease-leave': QUICK,
      '--ease-pop': QUICK,
      '--scale-icon-hover': '1',

      // Light and shadow are bevels: white on the top and left, grey then black on the bottom and right
      '--shadow-color': BLACK,
      '--elevation-less': RAISED(1, GREY),
      '--elevation-normal': RAISED(1, BLACK),
      '--elevation-more': RAISED(2, BLACK),

      // The brand: navy, with everything the library derives from it written out
      '--color-primary': NAVY,
      '--color-primary-deep': NAVY,
      '--color-primary-tint': '#aeb0d8',
      '--color-primary-strong': NAVY,
      '--color-on-primary': WHITE,
      '--color-text-inverse': WHITE,
      '--color-danger': '#990000',

      // Text
      '--color-text-normal': BLACK,
      '--color-text-less': '#404040',
      '--color-text-more': NAVY,
      '--color-link': '#0000cc',
      '--color-link-underline': '#b0b0ff',

      // Surfaces: grey cards and buttons, a navy fill for the loud one
      '--color-card-background-less': 'transparent',
      '--color-card-background-normal': FACE,
      '--color-button-background-less': 'transparent',
      '--color-button-background-normal': FACE,
      '--color-button-edge': 'transparent',
      ...filled(NAVY, WHITE),

      // Fields are white, sunken in the grey around them
      ...fieldFills(WHITE, FIELD_HOVER),
      '--color-field-background-error': FIELD_ERROR,
      '--color-field-background-error-hover': FIELD_ERROR_HOVER,

      // What floats: grey like a window, the desktop's teal for a veil, the tooltip's old yellow
      '--color-overlay-background': FACE,
      '--color-modal-background': FACE,
      '--color-modal-backdrop': VEIL,
      '--color-select-popup': FACE,
      '--color-select-option-active': SELECTION,
      '--color-select-check': WHITE,
      '--color-tooltip-background': '#ffffe1',
      '--color-tooltip-text': BLACK,
      '--color-popover-background': FACE,
      '--color-toast-background': FACE,
      '--color-dialog-background': FACE,
      '--color-dialog-backdrop': VEIL,
      '--color-drawer-background': FACE,
      '--color-drawer-backdrop': VEIL,
      '--color-menu-background': FACE,
      '--color-menu-item-active': SELECTION,

      // The options: white boxes, and a white tick or dot on the navy they fill with
      '--color-checkbox-background': WHITE,
      '--color-checkbox-background-hover': FIELD_HOVER,
      '--color-checkbox-background-error': FIELD_ERROR,
      '--color-checkbox-background-error-hover': FIELD_ERROR_HOVER,
      '--color-checkbox-check': WHITE,
      '--color-radio-background': WHITE,
      '--color-radio-background-hover': FIELD_HOVER,
      '--color-radio-background-error': FIELD_ERROR,
      '--color-radio-background-error-hover': FIELD_ERROR_HOVER,
      '--color-radio-dot': WHITE,
      '--color-toggle-background': GREY,
      '--color-toggle-background-hover': '#707070',
      '--color-toggle-thumb': WHITE,
      '--color-slider-track': GREY,
      '--color-slider-track-hover': '#707070',
      '--color-slider-track-error': '#d08080',
      '--color-slider-track-error-hover': '#c06868',
      '--color-slider-fill': NAVY,
      '--color-slider-thumb': WHITE,
      '--color-slider-error': '#990000',

      // Tabs, segments, a collapsed header, chips
      '--color-tabs-background': '#d0d0d0',
      '--color-tabs-thumb': WHITE,
      '--color-tabs-accent': NAVY,
      '--color-segmented-background': '#d0d0d0',
      '--color-segmented-background-hover': '#dedede',
      '--color-segmented-background-error': FIELD_ERROR_HOVER,
      '--color-collapsible-background': '#dcdcdc',
      '--color-collapsible-background-hover': '#e8e8e8',
      '--color-chip-background-removable': FACE,
      '--color-chip-background-selectable': '#dcdcdc',
      '--color-chip-hover': 'rgb(0 0 128 / 12%)',
      '--color-chip-pressed': 'rgb(0 0 128 / 25%)',
      '--color-chip-border': '#404040',

      // Pages, days, and the rows of a table
      '--color-pagination-background-hover': SELECTION,
      '--color-calendar-background-hover': SELECTION,
      '--color-table-line': GREY,
      '--color-table-row-hover': '#dcdcf2',
      '--color-table-row-selected': '#b8b8f0',
      '--color-table-sort-hover': SELECTION,

      // Banner: a pale one, the tooltip's yellow, and navy; no glow
      '--color-banner-background-less': '#e4e4e4',
      '--color-banner-background-normal': '#ffffe1',
      '--color-banner-glow': 'transparent',

      // Progress is a white well with navy filling it; lines are the bevel's grey
      '--color-progress-track': WHITE,
      '--color-progress-fill': NAVY,
      '--color-line': GREY,
      '--color-divider': GREY,

      // A teal mark with white digits, flat avatars, a mid-grey stand-in for loading text
      '--color-indicator-background': TEAL,
      '--color-indicator-text': WHITE,
      '--color-avatar-lightness': '0.72',
      '--color-avatar-chroma': '0.1',
      '--color-avatar-anonymous': '#dfdfdf',
      '--color-placeholder': '#9a9a9a',
    },
  };
})();

export const LOOKS: Look[] = [
  {
    value: 'default',
    label: 'Library',
    description: 'The library as it comes: nothing set.',
    vars: {},
  },
  SLATE,
  BRUTAL,
  CANDY,
  TERMINAL,
  LEXEND_LOOK,
  MAGAZINE,
  RETRO,
];
