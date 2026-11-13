# More or Less UI

A React UI library built on **relative scaling**: every size, radius, weight and shade is `less`, `normal` or
`more`, and every one of them is a CSS variable you can change.

```tsx
<Button size="more">Bigger</Button>
<Button size="less">Smaller</Button>
<Button size="1.5rem">Exactly this</Button>
```

- **38 components**: layout, text, forms (with dates, files and search), overlays, tables, toasts.
- **Zero runtime styling.** CSS Modules and CSS variables; no CSS-in-JS, nothing computed in JavaScript.
- **Re-skin from one place.** Change `--color-primary` and the fills, tints, shadows and focus rings follow.
- **Light and dark** themes, with an optional `ThemeProvider`.
- **Accessible by default**: native elements where they exist (`<dialog>`, `<input>`, `<fieldset>`), keyboard
  support, and a required accessible name on every control.
- **TypeScript first**, ESM and CommonJS.

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [The scale](#the-scale)
- [Components](#components)
- [Customizing the look](#customizing-the-look)
- [Dark mode](#dark-mode)
- [Frameworks and SSR](#frameworks-and-ssr)
- [Building on the tokens](#building-on-the-tokens)
- [Accessibility and languages](#accessibility-and-languages)
- [Contributing](#contributing)

## Installation

```bash
npm install more-or-less-ui
# or
pnpm add more-or-less-ui
# or
yarn add more-or-less-ui
```

**Requirements**

- React and React DOM 18.2 or newer (peer dependencies).
- A browser from 2024 or later: Chrome / Edge 119, Safari 17, Firefox 128. The styles use `color-mix()`,
  relative colors (`oklch(from …)`), `:has()`, the Popover API and `@property`. Squircle corners
  (`corner-shape`) are an extra for browsers that have it; others get round corners.

## Quick start

Import the stylesheet once, at the root of your app:

```tsx
import 'more-or-less-ui/styles.css';
```

then use the components:

```tsx
import { useState } from 'react';
import { Button, Card, Select, Stack, TextField, Title } from 'more-or-less-ui';

export function SignUp() {
  const [email, setEmail] = useState('');

  return (
    <Card padding="more">
      <Stack gap="more">
        <Title>Create your account</Title>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          isRequired
        />
        <Select
          label="Plan"
          defaultValue="free"
          options={[
            { value: 'free', label: 'Free' },
            { value: 'pro', label: 'Pro', description: 'For teams' },
          ]}
        />
        <Stack direction="row" gap="less" justify="end">
          <Button background="less">Cancel</Button>
          <Button background="more" type="submit">
            Sign up
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
```

You can also `@import 'more-or-less-ui/styles.css';` from a CSS file.

## The scale

There is one idea. A prop that sets how big, round, heavy, loud or spaced something is takes the same
values everywhere:

```tsx
<Card padding="more" />    // one step up
<Card padding="less" />    // one step down
<Card padding="normal" />  // the default, so you can leave it out
<Card padding="1.5rem" />  // escape hatch: any CSS value
<Card padding={18} />      // escape hatch: a number is pixels
```

There is no `sm` / `md` / `lg` / `xl` / `2xl`. The three steps are CSS variables (`--space-less`,
`--space-normal`, `--space-more`), so changing what `more` means changes it everywhere at once. See
[Customizing the look](#customizing-the-look).

The type is `ScaleProp` (`'less' | 'normal' | 'more' | string | number | undefined`), exported for your own
components.

### Which component takes which prop

Props are named after the CSS property they drive. A component takes only the ones that make sense for it, so
an unknown prop is a TypeScript error rather than a silent no-op.

| Prop                                        | Drives                                                                     | Components                                                                                                                                                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`                                      | `font-size`; padding and gaps are in `em`, so they follow                  | Text, Title, Button, Banner, Avatar, Chip, Link, Breadcrumb, Pagination, Progress, Spinner, Indicator, Collapsible, Tabs, SegmentedControl, Table, Calendar, and every text-like field (TextField, Textarea, Select, Slider, FileUpload, DateField, DatePicker); Toast, per toast |
| `padding`, `margin` (and `paddingLeft` ...) | the CSS property                                                           | Box, Stack and Grid; Card takes `padding` only                                                                                                                                                                                                                                    |
| `gap`                                       | `gap`                                                                      | Stack, Grid                                                                                                                                                                                                                                                                       |
| `borderRadius`, `boxShadow`                 | the CSS property                                                           | Card                                                                                                                                                                                                                                                                              |
| `background`                                | `background`: transparent, a tint, the brand color (`less` → `more`)       | Card, Button, Banner                                                                                                                                                                                                                                                              |
| `fontWeight`                                | `font-weight`                                                              | Text, Title                                                                                                                                                                                                                                                                       |
| `color`                                     | how much the text stands out: quiet, plain, brand color (or any CSS color) | Text, Title                                                                                                                                                                                                                                                                       |

Checkbox, Radio, Toggle, Divider and the overlays (Dialog, Drawer, Popover, Menu, Tooltip) have no scale
props: they are sized in `em`, so they follow the font size around them. A button's corners and shadow are
fixed by the library; to change them everywhere, change the tokens ([below](#customizing-the-look)).

### Defaults

A prop you leave out falls back to `normal` where that makes a good starting point. `Card` defaults
`padding`, `borderRadius`, `boxShadow` and `background`, so a bare `<Card />` is already a surface; `Stack`
and `Grid` default `gap`; `Text` and `Title` default `size`, `fontWeight` and `color`. `Box` is the
exception: it adds only the margin and padding you ask for.

To switch a default off, pass an escape-hatch value: `padding={0}`, `boxShadow="none"`,
`background="transparent"`. (`background="less"` is transparent too.) The per-side props (`paddingLeft`,
`marginTop`, ...) have no default; they only override their shorthand.

```tsx
// The usual case: pick a step
<Button size="more" />
<Card padding="more" borderRadius="less" />
<Box padding="more" marginBottom="less" />

// The exception: say exactly what you mean
<Button size="1.5rem" />
<Card borderRadius="50%" boxShadow="none" />
<Box margin="2rem" padding="1rem 2rem" />
```

## Components

**Layout and text**

- `Box`: margin and padding, nothing else
- `Card`: a surface with padding, radius, shadow and background
- `Stack`: flex layout, a column by default; `direction`, `gap`, `align`, `justify`, `wrap`
- `Grid`: a fixed number of columns, or as many as fit (`columns={{ minWidth: 240 }}`)
- `Divider`: a hairline, horizontal or vertical
- `Text`: a run of text with `size`, `fontWeight`, `color`
- `Title`: a heading (`h1`-`h6` through `as`) with its own size, weight and font tokens
- `Link` and `LinkProvider`: a link, and the one place you tell every link how your router navigates

**Buttons and actions**

- `Button`: text, an icon, or both; `isDisabled`, `isLoading`
- `Menu`: a list of actions opened from a trigger
- `Chip`: static, removable or selectable
- `Toggle`: an on/off switch

**Form fields**

- `TextField`: text, email, search, tel, url, password (with a reveal button) and number (with steppers)
- `Textarea`
- `Select`: one component for select, combobox and autocomplete: searchable, multiple, clearable, and
  searched by your server through `onSearch`
- `Checkbox` and `Radio`: a group of options in a `<fieldset>`, from an `options` array
- `SegmentedControl`: one of a few options, as a row of buttons
- `Slider`
- `FileUpload`: a drop zone and file list; keep the files in the form, or upload each one as it is picked
- `DateField`, `DatePicker`, `Calendar`: dates typed in the locale's order, with a calendar popup

Every field takes `label` (or `aria-label`), `error`, `isDisabled` and `isRequired`, and the same fill, so a
form looks the same whichever you mix. A field's `tooltip` adds an ⓘ button beside its label.

**Feedback**

- `Banner`: a message in the page, from quiet to loud
- `ToastProvider` and `useToast`: messages that appear over the page for a moment
- `Spinner`, `Progress`, `Indicator` (a dot or count on something), `Avatar`

**Overlays**

- `Dialog` and `Drawer`: modals, on a native `<dialog>`
- `Popover`: a non-modal panel next to a trigger
- `Tooltip`

**Navigation and disclosure**

- `Tabs`, `Breadcrumb`, `Pagination`, `Collapsible`

**Data**

- `Table`: sortable columns, row selection, and a render function per cell

**Loading** is not a prop. Put `aria-busy="true"` on any element and the text, avatars and option labels
inside it become quiet blocks, in the real layout:

```tsx
<Stack aria-busy={isLoading}>
  <Title>{user?.name ?? 'A placeholder name'}</Title>
  <Text>{user?.bio ?? 'A placeholder about as long as the real bio'}</Text>
</Stack>
```

**Dates and times** are local strings, never a `Date` or an instant: `'1988-03-14'` (`LocalDate`),
`'14:30'` (`LocalTime`), `'2026-11-11T14:30'` (`LocalDateTime`). A value is what someone read off a calendar,
so it can't shift a day when the user and the server are in different time zones. `toDate`, `fromDate`,
`toInstant`, `fromInstant` and `today` convert between them and the values your server stores.

The complete props of every component are in its TypeScript types and, with usage examples, in the
[design specification](https://github.com/tramax/more-or-less-ui/blob/main/DESIGN.md).

## Customizing the look

Everything visual is a CSS variable on `:root`, so you re-skin the library with a stylesheet and no build
step. Put your overrides **after** the library's stylesheet (or in a later `<link>`), because they have the
same specificity and the last one wins:

```css
/* globals.css */
@import 'more-or-less-ui/styles.css';

:root {
  --color-primary: #4f46e5;
}
```

The variables come in four layers. Start at the top; most projects never need the bottom.

### 1. The brand color

`--color-primary` is the one color you need to set. The rest is built from it:

- the fill of **every field** (the primary at 15% opacity, 25% on hover)
- **Button**, Banner and Card's `more` backgrounds, and the tinted `normal` ones
- the focus ring, text selection, Slider, Progress, selected Chip, current page and current day
- the tint of every shadow
- **text on the brand color** (a button label, a check mark), which flips between black and white for contrast
- links and `color="more"` text, a darker mix of the primary, so they stay readable on a white page

The default (`#c6b18b`, a sand) is pale. If your brand color is dark, or very light, look at a Button, a
Checkbox and a `color="more"` Text in both themes. Those are where contrast shows first.

### 2. The scales

Five scales of three steps. These are the ones that give the library its name.

| Variables                                                  | Default (less / normal / more) | What they change                                                                         |
| ---------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `--size-less` `--size-normal` `--size-more`                | 14 / 16 / 20 px                | font size of everything with a `size` prop, and the padding and gaps that follow in `em` |
| `--space-less` `--space-normal` `--space-more`             | 8 / 16 / 24 px                 | `padding`, `margin` and `gap` on Box, Stack, Grid and Card                               |
| `--radius-less` `--radius-normal` `--radius-more`          | 8 / 20 / 32 px                 | corners of Card, Button, Banner, Dialog, Drawer, Tabs, SegmentedControl, Collapsible     |
| `--weight-less` `--weight-normal` `--weight-more`          | 300 / 400 / 600                | font weight of text, buttons, banners, toasts, table headers                             |
| `--elevation-less` `--elevation-normal` `--elevation-more` | two-layer shadows              | `box-shadow` of cards, buttons, overlays, tabs, toasts                                   |

Headings have scales of their own, so changing the body text doesn't move them:
`--size-title-*`, `--weight-title-*` and `--line-height-title`. (`--size-title-more` is fluid: 32px on a
phone, 48px on a wide screen.)

Recipes:

```css
:root {
  /* Sharper corners */
  --radius-less: 0;
  --radius-normal: 0.25rem;
  --radius-more: 0.5rem;

  /* A denser interface: smaller type and tighter spacing */
  --size-less: 0.8125rem;
  --size-normal: 0.875rem;
  --size-more: 1rem;
  --space-less: 0.25rem;
  --space-normal: 0.5rem;
  --space-more: 1rem;

  /* Flat: no shadows */
  --elevation-less: none;
  --elevation-normal: none;
  --elevation-more: none;
}
```

Motion is a token too. `--ease-enter`, `--ease-leave` and `--ease-pop` are the curves behind the springy
hover and press, and `--scale-icon-hover` is how much a small icon grows. Set the `--ease-*` curves to
`ease-out` for a calmer feel. Users who ask for reduced motion get none of it, whatever you set.

### 3. Fonts

The library loads no font files. Load yours as usual (`@font-face`, a `<link>`), then name them:

```css
:root {
  --font-family-body: 'Inter', system-ui, sans-serif; /* all text */
  --font-family-title: 'Fraunces', Georgia, serif; /* optional: Title only */
}
```

No component sets a font of its own: text inherits the body font, and buttons and fields are reset to inherit
it. `--font-family-title` defaults to `inherit`, so titles use the body font until you set it. Set
`--font-family-body` on `:root` or `body`; for one part of a page, use a plain `font-family` on that element
and everything inside follows.

### 4. Individual components

Every component reads its colors through its own tokens, named `--color-<component>-<part>[-<state>]`.
Each one is, by default, an alias of a shared value, so you can change one component without touching the rest:

```css
:root {
  /* A black "more" button with white text. Set a background and its text together. */
  --color-button-background-more: #111;
  --color-button-text-more: #fff;

  /* A calmer tooltip and popover surface: everything floating shares this */
  --color-overlay-background: color-mix(in oklab, Canvas 85%, transparent);

  /* Tabs' selected-tab icon */
  --color-tabs-accent: rebeccapurple;

  /* A different hairline for Divider and Table rules */
  --color-line: color-mix(in oklab, CanvasText 15%, transparent);
}
```

| Shared token                                         | What reads it                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `--color-primary`                                    | the brand color, above                                                       |
| `--color-field-background` (`-hover`, `-error`)      | every field, and the option controls (Checkbox, Radio, Toggle, Slider track) |
| `--color-danger`                                     | error messages and the error fill                                            |
| `--color-overlay-background`                         | Select's popup, Tooltip, Popover, Menu, Toast, Tabs: the frosted surface     |
| `--color-modal-background`, `--color-modal-backdrop` | Dialog and Drawer                                                            |
| `--color-line`                                       | Divider, Table rules                                                         |
| `--color-on-primary`                                 | text, ticks and dots drawn on the brand color                                |

The text fields (TextField, Textarea, Select, FileUpload, DateField) have no fill tokens of their own: they all
read `--color-field-background*`, so a form never ends up with fields that don't match. To change every field,
change those four.

The full list is in [`tokens.css`](https://github.com/tramax/more-or-less-ui/blob/main/src/theme/tokens.css),
with a comment on each token. It also ships in the package as `more-or-less-ui/theme/tokens.css`.

### Where to set tokens

- **On `:root`** is the safe place, for everything above.
- **A component token on a wrapper** works: `.promo { --color-button-background-more: crimson; }` re-colors
  the buttons inside `.promo`, because a button reads its token where it is drawn.
- **`--color-primary` on a wrapper** does _not_ re-skin it. The tints, fills and strong colors that come
  from the primary are worked out once, on `:root`, and inherited as finished colors. Set `--color-primary` on
  `:root`, or set the component tokens you want on the wrapper.
- **One element.** The escape-hatch props (`borderRadius="50%"`, `padding={0}`), `style` and `className`
  work on every component. Don't select the library's own class names: they are generated and change.

### JavaScript

For a chart, a canvas or anything else that can't read CSS, read the tokens at runtime:

```tsx
import { getCSSVariable, getScaleTokens, getColorTokens } from 'more-or-less-ui';

getCSSVariable('--color-primary'); // '#c6b18b'
getScaleTokens().radius.more; // '2rem'
getColorTokens(); // every --color-* on :root
```

## Dark mode

The dark theme is a set of overrides under `[data-theme='dark']` on `<html>`: it sets `color-scheme: dark`
(so the page, form controls and scrollbars go dark), heavier shadows, a lighter error color, and a dark
version of each brand-colored fill.

**With React**, `ThemeProvider` sets the attribute, follows the operating system, and remembers the choice:

```tsx
import { ThemeProvider, useTheme } from 'more-or-less-ui';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="my-app-theme">
      <ThemeSwitch />
    </ThemeProvider>
  );
}

function ThemeSwitch() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

`defaultTheme` is `'system'`; `storageKey` is what turns remembering on (without it nothing is saved);
`enableSystem` and `disableTransitionOnChange` default to `true`. `resolvedTheme` is the `'light'` or
`'dark'` that is actually showing.

**Without React**, set the attribute yourself. This script, in `<head>`, follows the operating system and
avoids a flash of the light theme:

```html
<script>
  document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
</script>
```

Only the `data-theme` attribute turns the full dark theme on. A bare `@media (prefers-color-scheme: dark)`
rule that sets `color-scheme: dark` darkens the page and the controls, but not the dark fills or shadows.

**With your own brand color**, the dark theme still has the library's umber fills (`#4a3f33`) where the light
theme has the brand color: the `more` backgrounds of Button, Card and Banner, selected Chip, the current
page, day and segment. Give them your dark color, with its text, under a selector that beats the library's:

```css
:root[data-theme='dark'] {
  --color-button-background-more: #3730a3;
  --color-button-text-more: white;
  --color-card-background-more: #3730a3;
  --color-banner-background-more: #3730a3;
  --color-banner-text-more: white;
  --color-chip-background-selected: #3730a3;
  --color-chip-text-selected: white;
  --color-pagination-background-current: #3730a3;
  --color-pagination-text-current: white;
  --color-calendar-background-current: #3730a3;
  --color-calendar-text-current: white;
  --color-datefield-segment-background-active: #3730a3;
  --color-datefield-segment-text-active: white;
  --color-segmented-thumb: #3730a3;
  --color-segmented-text-selected: white;
}
```

The list is in [`themes.css`](https://github.com/tramax/more-or-less-ui/blob/main/src/theme/themes.css).
The theme is a page-wide setting on `<html>`: a dark region inside a light page is not supported.

## Frameworks and SSR

- **Vite, Create React App and similar**: import `more-or-less-ui/styles.css` in your entry file.
- **Next.js (App Router)**: import the stylesheet in `app/layout.tsx`. The package is marked `"use client"`,
  so you can import components from server components; they render on the server like any client component.
- **`ThemeProvider` renders its children only after it mounts** (it reads `localStorage` and the system
  setting first). On a server-rendered page that means everything inside it is missing from the HTML. Either
  keep it small and put it around the parts that need `useTheme`, or skip it and use the `<head>` script
  above with your own toggle. The CSS variables and every other component are safe to render on the server.
- **Router links**: wrap your app in `LinkProvider navigate={...}` once and every `Link` navigates through
  your router (React Router, Next, TanStack, ...) instead of reloading the page. Links to other sites,
  downloads and modified clicks are left to the browser.
- **Toasts**: put one `ToastProvider` near the root, then call `useToast().add({ title, description })`
  anywhere below it.
- **Size**: the JavaScript is one tree-shakeable module. The CSS is one file (`styles.css`, about 110 KB
  before compression) that you import whole.

## Building on the tokens

Your own components can use the same scale, so they change when the tokens do:

```tsx
import { Card, Stack, Text, type ScaleProp } from 'more-or-less-ui';

interface StatCardProps {
  value: string;
  label: string;
  size?: ScaleProp;
  borderRadius?: ScaleProp;
  boxShadow?: ScaleProp;
}

export function StatCard({ value, label, size, borderRadius, boxShadow }: StatCardProps) {
  return (
    <Card borderRadius={borderRadius} boxShadow={boxShadow}>
      <Stack gap="less">
        <Text size={size} fontWeight="more">
          {value}
        </Text>
        <Text size="less" color="less">
          {label}
        </Text>
      </Stack>
    </Card>
  );
}

<StatCard value="$12,345" label="Revenue" size="more" borderRadius="more" />;
<StatCard value="1,234" label="Users" size="less" boxShadow="less" />;
<StatCard value="99%" label="Uptime" borderRadius="12px" />; // escape hatch
```

In your own CSS, use the variables directly: `padding: var(--space-normal)`,
`border-radius: var(--radius-more)`, `color: var(--color-text-less)`,
`box-shadow: var(--elevation-normal)`.

## Accessibility and languages

- A labelled control needs a name: TypeScript requires a `label`, an `aria-label` or an `aria-labelledby`.
- Groups (Checkbox, Radio, SegmentedControl) are a `<fieldset>` with a `<legend>`; errors are linked with
  `aria-describedby` and carry an icon as well as a color.
- Dialog and Drawer are native `<dialog>` elements: the browser makes the page behind them inert and returns
  focus. Menu, Tabs, Calendar, Collapsible and Breadcrumb follow the WAI-ARIA authoring patterns.
- Motion respects `prefers-reduced-motion`.
- The words the library shows (calendar buttons, row-selection labels, pagination) are props on the
  component (`labels` on Calendar, DateField, DatePicker, Pagination and Table), so you can translate them.
  Calendar formats dates in the `locale` you pass.

## Contributing

```bash
pnpm install
pnpm storybook      # develop and look at every component
pnpm test           # unit tests
pnpm typecheck
pnpm lint
pnpm check:dup      # the duplicate-code ceiling
pnpm build          # writes dist/
```

See [CONTRIBUTING.md](https://github.com/tramax/more-or-less-ui/blob/main/CONTRIBUTING.md) for how
components are structured and how a release is made, and the
[design specification](https://github.com/tramax/more-or-less-ui/blob/main/DESIGN.md) for why they are built
this way.

## License

[MIT](https://github.com/tramax/more-or-less-ui/blob/main/LICENSE)
