# More or Less UI — Design Specification

> A React UI library built on **relative scaling** (`more`/`less`/`normal`) with CSS Variables for theming and CSS Modules for styling.

---

## Core Philosophy

**One mental model for everything:** Every sizing/styling prop accepts three intentional variants + an escape hatch.

```tsx
// Universal pattern
<Component />                    // normal (default)
<Component prop="more" />        // one step up
<Component prop="less" />        // one step down
<Component prop="1.5rem" />      // escape hatch: any CSS value
<Component prop={18} />          // escape hatch: number = pixels
```

**No `sm`/`md`/`lg`/`xl`/`2xl` — just `more`/`less`/`normal`.**

---

## Architecture Decisions

### Build & Tooling

| Decision               | Choice                           | Rationale                                                                                                                                                                                                |
| ---------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Build Tool**         | `tsup`                           | Zero-config, dual ESM/CJS, fast (esbuild), built-in `--dts`                                                                                                                                              |
| **Package Manager**    | `pnpm`                           | Disk-efficient, fast, strict dependency resolution                                                                                                                                                       |
| **Testing**            | `Vitest` + React Testing Library | Native ESM, TypeScript, shares config with Vite/tsup                                                                                                                                                     |
| **Component Explorer** | **Storybook**                    | Mature ecosystem, Chromatic integration, team familiarity                                                                                                                                                |
| **Styling**            | **CSS Modules + CSS Variables**  | Zero runtime, native theming, SSR-safe, escape hatch via inline styles                                                                                                                                   |
| **CSS Modules naming** | `*.module.css`                   | Required for Vite (Storybook/Vitest) and esbuild (tsup) to treat a file as a CSS Module. tsup emits component CSS into `dist/styles.css` (single consumer import) via a small plugin in `tsup.config.ts` |
| **Publishing**         | Public npm + Changesets          | Standard versioning, automated releases                                                                                                                                                                  |

### Theming System

| Decision            | Choice                                                                |
| ------------------- | --------------------------------------------------------------------- |
| **Mechanism**       | CSS Variables (native)                                                |
| **Theme Switching** | Both: CSS-first (`[data-theme]`) + optional React `ThemeProvider`     |
| **Token Structure** | 3 values per property (less/normal/more) — **15 CSS variables total** |

---

## The "More or Less" Scale System

### Type Definitions

```typescript
// types/scale.ts
export type Variant = 'less' | 'normal' | 'more';
export type ScaleProp = Variant | string | number | undefined;

export function isVariant(value: ScaleProp): value is Variant {
  return value === 'less' || value === 'normal' || value === 'more';
}
```

### CSS Variables (Only 15 Total)

```css
/* theme/tokens.css */
:root {
  /* Size scale */
  --size-less: 0.875rem; /* 14px */
  --size-normal: 1rem; /* 16px */
  --size-more: 1.25rem; /* 20px */

  /* Radius scale */
  --radius-less: 0.5rem; /* 8px */
  --radius-normal: 1.25rem; /* 20px */
  --radius-more: 2rem; /* 32px */

  /* Weight scale */
  --weight-less: 300;
  --weight-normal: 400;
  --weight-more: 600;

  /* Spacing scale */
  --space-less: 0.5rem; /* 8px */
  --space-normal: 1rem; /* 16px */
  --space-more: 1.5rem; /* 24px */

  /* Elevation scale */
  --elevation-less: 0 1px 2px rgb(0 0 0 / 0.05);
  --elevation-normal: 0 4px 6px rgb(0 0 0 / 0.07);
  --elevation-more: 0 10px 15px rgb(0 0 0 / 0.1);
}
```

### Motion Tokens (Separate from Scale)

Three easing curves, each defined once in `theme/tokens.css` and used by every component that moves:
`--ease-enter` (overshoots its target by a few percent and settles: springy), `--ease-leave` (no
overshoot, so nothing dips below its resting value once the pointer has gone) and `--ease-pop` (a
gentler overshoot, for small marks: Radio's dot, Toggle's thumb, Select's chevron). Button, the
Checkbox / Radio options (`_shared/OptionGroup.module.css`) and the Select popup are on the first two. A new moving component uses these, not its own `cubic-bezier()`.

### Font Tokens

Two tokens, the way to set fonts:

```css
:root {
  --font-family-body: 'Inter', system-ui, sans-serif; /* all text */
  --font-family-title: 'Fraunces', Georgia, serif; /* headings (Title) only; optional */
}
```

- **`--font-family-body`** is the font of all text. Its default is the system stack (`system-ui`, ...).
  `styles.css` applies it once, on `body`, and everything inherits it from there: no component sets a
  font of its own, and the form controls that browsers give their own font (`button`, `input`,
  `textarea`, `select`) are reset to `font: inherit`. `tokens.test.ts` fails if a component's CSS names
  a font other than `inherit` or a `--font-family-*` token. Because `body` is the only element that reads
  it, set it on `:root` or `body`; for another font in one part of a page, set a plain `font-family` on
  that element, and everything inside (Titles included, while their token is unset) inherits it.
- **`--font-family-title`** is the font of Title. Its default, `inherit`, leaves it without a value, so a
  title keeps the font around it, which is the body font unless something above it sets another. Title
  reads it itself, so it works on any element: on `:root` for every title, on a section for the titles
  inside it. See [Title](#title--headings).

There is no token per component (no `--font-family-button`): a font is a choice for the whole page,
and headings are the one place a second typeface is common.

### Color Tokens (Separate from Scale)

Deliberately minimal for now: **one brand color, an error color (`--color-danger`), a `background` scale per component that has one (Card, Button, Banner), one opaque brand tint (`--color-primary-tint`) that Button's `normal` and Banner's `normal` alias, the opposite of the current text color (`--color-text-inverse`, which Banner's glow aliases), one faint field fill (`--color-field-background*`) that TextField, Textarea, Select, FileUpload and DateField use directly through `_shared/TextFieldFrame`, and Checkbox, Radio, Toggle and Slider alias** (Banner's `less` aliases it too), **and secondary text (`--color-text-less`, 70% of the text color) that the option descriptions and Select's empty message share with Text's and Title's `color` scale**. That scale is `--color-text-less` / `-normal` / `-more` (the last is the brand color toward the text color, for contrast). No palettes, no
numbered shades (50-900), no primary/secondary families. More colors get added when a component
actually needs one.

```css
/* theme/tokens.css (alongside the scale tokens) */
:root {
  --color-primary: #3b82f6;

  /* Card's `background` less / normal / more */
  --color-card-background-less: transparent;
  --color-card-background-normal: Canvas; /* system canvas: white in light, system dark in dark */
  --color-card-background-more: #d9c9ad; /* sand */

  /* Button's `background`, separate so each component can be customised on its own */
  --color-button-background-less: transparent;
  --color-button-background-normal: color-mix(in oklab, var(--color-primary) 40%, Canvas);
  --color-button-background-more: #d9c9ad; /* sand */
  --color-button-text-more: var(--color-on-primary); /* text on the `more` background */
}

/* theme/themes.css */
[data-theme='dark'] {
  color-scheme: dark; /* flips system colors: Canvas, CanvasText, form controls, scrollbars */
  --color-card-background-more: #4a3f33; /* umber */
  --color-button-background-more: #4a3f33; /* umber */
  --color-button-text-more: white; /* set with the background: on-primary follows the sand primary */
  /* ...heavier --elevation-* shadows */
}
```

A recipe is defined once, as a shared token (`--color-field-background*`, and `--color-on-primary` for a
mark drawn on the brand color), and each component's own token aliases it
(`--color-radio-background: var(--color-field-background)`). Components stay customisable on their
own without repeating the expression; `src/theme/tokens.test.ts` enforces it. The exception is what all
fields share: TextField, Textarea, Select, FileUpload and DateField look the same, so they have no fill
tokens of their own, and `_shared/TextFieldFrame` sets the `--field-*` hooks from `--color-field-background*`.

Page text and background use the browser's system colors (`CanvasText` / `Canvas`), so dark mode
needs no text/background variables of its own.

> **Note:** the Button and Card sections below were written against the earlier, larger palette
> (`--color-primary-bg`, `--color-card-bg`, ...). Those variables no longer exist; component colors
> will be redesigned when those components are built.

---

## Prop Naming Convention

### Direct CSS Property Names (1:1 Mapping)

Use standard CSS property names (camelCase) for direct mappings — **no translation layer**.

| Prop Name       | CSS Property     | Type        |
| --------------- | ---------------- | ----------- |
| `borderRadius`  | `border-radius`  | `ScaleProp` |
| `fontWeight`    | `font-weight`    | `ScaleProp` |
| `boxShadow`     | `box-shadow`     | `ScaleProp` |
| `padding`       | `padding`        | `ScaleProp` |
| `paddingLeft`   | `padding-left`   | `ScaleProp` |
| `paddingRight`  | `padding-right`  | `ScaleProp` |
| `paddingTop`    | `padding-top`    | `ScaleProp` |
| `paddingBottom` | `padding-bottom` | `ScaleProp` |
| `margin`        | `margin`         | `ScaleProp` |
| `marginLeft`    | `margin-left`    | `ScaleProp` |
| `marginRight`   | `margin-right`   | `ScaleProp` |
| `marginTop`     | `margin-top`     | `ScaleProp` |
| `marginBottom`  | `margin-bottom`  | `ScaleProp` |

### Semantic/Compound Props (Multiple CSS Properties)

| Prop Name | Affects                        | Type        |
| --------- | ------------------------------ | ----------- |
| `size`    | `fontSize` + `padding` + `gap` | `ScaleProp` |

---

## Component Implementation Pattern

### CSS Module for Variants, Inline Styles for Escape Hatch

```css
/* Component.module.css */
.component {
  /* Base (normal) values */
  font-size: var(--size-normal);
  padding: calc(var(--space-normal) * 0.5) var(--space-normal);
  border-radius: var(--radius-normal);
  box-shadow: var(--elevation-normal);
  font-weight: var(--weight-normal);
  gap: var(--space-normal);
}

/* Variant classes */
.sizeLess {
  font-size: var(--size-less);
  padding: calc(var(--space-less) * 0.5) var(--space-less);
  gap: var(--space-less);
}
.sizeMore {
  font-size: var(--size-more);
  padding: calc(var(--space-more) * 0.5) var(--space-more);
  gap: var(--space-more);
}

.borderRadiusLess {
  border-radius: var(--radius-less);
}
.borderRadiusMore {
  border-radius: var(--radius-more);
}

.fontWeightLess {
  font-weight: var(--weight-less);
}
.fontWeightMore {
  font-weight: var(--weight-more);
}

.boxShadowLess {
  box-shadow: var(--elevation-less);
}
.boxShadowMore {
  box-shadow: var(--elevation-more);
}

.paddingLess {
  padding: calc(var(--space-less) * 0.5) var(--space-less);
}
.paddingMore {
  padding: calc(var(--space-more) * 0.5) var(--space-more);
}
```

```tsx
// Component.tsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { ScaleProp, isVariant } from '../types/scale';
import styles from './Component.module.css';

interface ComponentProps {
  // Compound
  size?: ScaleProp;
  // Direct mappings
  borderRadius?: ScaleProp;
  fontWeight?: ScaleProp;
  boxShadow?: ScaleProp;
  padding?: ScaleProp;
  // ...
}

const variantClassMap = {
  size: { less: styles.sizeLess, more: styles.sizeMore },
  borderRadius: { less: styles.borderRadiusLess, more: styles.borderRadiusMore },
  fontWeight: { less: styles.fontWeightLess, more: styles.fontWeightMore },
  boxShadow: { less: styles.boxShadowLess, more: styles.boxShadowMore },
  padding: { less: styles.paddingLess, more: styles.paddingMore },
} as const;

function getVariantClass(prop: keyof typeof variantClassMap, value: ScaleProp): string | undefined {
  if (!isVariant(value) || value === 'normal') return undefined;
  return variantClassMap[prop]?.[value as 'less' | 'more'];
}

function getInlineStyle(prop: string, value: ScaleProp): React.CSSProperties | undefined {
  if (value !== undefined && !isVariant(value)) {
    const cssValue = typeof value === 'number' ? `${value}px` : value;
    // Direct mapping: prop name = CSS property name
    const cssProp = prop; // Direct mapping: prop name = CSS property name
    return { [cssProp]: cssValue };
  }
  return undefined;
}

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ size, borderRadius, fontWeight, boxShadow, padding, ...props }, ref) => {
    // CSS Module classes for standard variants
    const variantClasses = [
      getVariantClass('size', size),
      getVariantClass('borderRadius', borderRadius),
      getVariantClass('fontWeight', fontWeight),
      getVariantClass('boxShadow', boxShadow),
      getVariantClass('padding', padding),
    ].filter(Boolean);

    // Inline styles ONLY for escape hatch
    const inlineStyles = [
      getInlineStyle('fontSize', size), // size escape → fontSize
      getInlineStyle('padding', size), // size escape → padding
      getInlineStyle('gap', size), // size escape → gap
      getInlineStyle('borderRadius', borderRadius),
      getInlineStyle('fontWeight', fontWeight),
      getInlineStyle('boxShadow', boxShadow),
      getInlineStyle('padding', padding),
    ].reduce((acc, s) => ({ ...acc, ...s }), {});

    return (
      <div
        ref={ref}
        className={clsx(styles.component, ...variantClasses, props.className)}
        style={{ ...inlineStyles, ...props.style }}
        {...props}
      />
    );
  },
);
```

---

## Usage Examples

### Standard Variants (90% of cases)

```tsx
<Button />                                    // All normal
<Button size="more" />                        // Larger text + padding + gap
<Button borderRadius="more" />                // Rounder corners
<Button fontWeight="more" />                  // Semibold
<Button boxShadow="less" />                   // Flatter
<Button padding="less" />                     // Tighter padding

<Card
  padding="more"
  margin="less"
  borderRadius="more"
  boxShadow="less"
/>
```

### Escape Hatch (10% of cases)

```tsx
<Button
  size="1.5rem"                    // Exact font size
  borderRadius="50%"               // Full circle
  fontWeight={700}                 // Bold (number = px for fontWeight)
  boxShadow="0 8px 16px rgba(0,0,0,0.2)"
  padding="12px 24px"
/>

<Card
  borderRadius="12px"
  padding="1rem 2rem"
/>
```

---

## Primitive Components

### Box — Spacing Only

`Box` provides margin and padding for layout and nothing else. It has no defaults and paints nothing:
a bare `<Box>` is a plain `div`. Every prop is a `ScaleProp` (`less` / `normal` / `more` or an escape
hatch). `marginLeft="auto"` pushes a box to the end of a row.

```tsx
// components/Box/Box.tsx
interface BoxProps {
  padding?: ScaleProp;
  paddingLeft?: ScaleProp;
  paddingRight?: ScaleProp;
  paddingTop?: ScaleProp;
  paddingBottom?: ScaleProp;
  margin?: ScaleProp;
  marginLeft?: ScaleProp;
  marginRight?: ScaleProp;
  marginTop?: ScaleProp;
  marginBottom?: ScaleProp;

  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
```

### Card — The Surface

`Card` is a `Box` with a surface: radius, shadow and background. It renders a Box, so the padding
props and classes are Box's (`Card.module.css` has only the surface classes). Every prop defaults to
`normal`, so a bare `<Card />` is a styled surface; opt out with `padding={0}`, `boxShadow="none"`,
`background="transparent"`. It has no margin props: the space around a card comes from the layout it
sits in (a Stack's `gap`, or a wrapping Box). Background uses `--color-card-background-*`.

```tsx
// components/Card/Card.tsx
interface CardProps extends Omit<BoxProps, 'margin' | `margin${string}`> {
  borderRadius?: ScaleProp; // default normal
  boxShadow?: ScaleProp; // default normal
  background?: ScaleProp; // default normal
  // padding defaults to normal
}
```

Still to come, so that Card earns its name: header / body / footer slots, a semantic `as`, and an
interactive state (`onClick` / `href`: hover, focus ring).

### Stack, Grid — Layout

One flex component, not two: `Stack` is a column with a gap by default, and `direction="row"` makes it
a row. There is no `Flex`, `HStack` or `VStack`. It extends `BoxProps`, so it also takes padding and
margin. The common cases (form rhythm, toolbar, wrapping tag list, header with actions) are all props:

```tsx
<Stack>                                              // column, gap normal
<Stack direction="row" align="center" gap="less">    // toolbar
<Stack direction="row" justify="between">            // title left, actions right
<Stack direction="row" wrap>                         // tag list
```

```tsx
// components/Stack/Stack.tsx
interface StackProps extends BoxProps {
  direction?: 'column' | 'row'; // default column; no -reverse (it breaks tab order)
  gap?: ScaleProp; // default normal
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}
// Padding and margin are Box's: Stack renders a Box and adds only `display: flex`, the gap and the
// direction / align / justify / wrap classes (one class per value, as Checkbox's `orientation`).

// components/Grid/Grid.tsx
type GridProps = BoxProps & {
  gap?: ScaleProp; // default normal
  columns?: number | { minWidth: string | number }; // none: a single column
};
```

```tsx
<Grid>                                    // one column
<Grid columns={3}>                        // three equal columns
<Grid columns={{ minWidth: '14rem' }}>    // as many equal columns as fit, each at least 14rem
```

`columns` is one prop, so a fixed count and a minimum width can't be set at once. A number is a count
(made a whole number of at least 1; NaN is ignored). `{ minWidth }` is the card grid: as many equal columns
as the width allows, with no breakpoints, and a column shrinks below `minWidth` when the parent is
narrower. `minWidth` is a plain CSS length (a number is pixels), not a scale: a width has no
less / normal / more, and `less` would mean more columns. A percentage is a share of the Grid's width, and the
gap counts against it, so `25%` with a gap fits 3 columns, not 4. Use a length for a card grid, and
`columns` for a count. A bare `<Grid>` is a single column with a gap: choosing a layout is explicit.

`gap` (the same scale as padding and margin) is shared by Stack and Grid through `_shared/Gap`, which
holds the three classes and `resolveGap`. Both render a Box for padding and margin.

Open: switching from row to column on narrow screens (prefer a container query over breakpoint objects).
No `divider` prop; put a [`Divider`](#divider) between children.

### Text — Typography

`Text` is a run of text: a `span` unless `as` says otherwise. It sets type size, weight and color and
nothing else. A heading is a [`Title`](#title--headings), which has the same props on the title tokens.
There is no `Paragraph` or `Label`: a paragraph is `<Text as="p">`.

```tsx
// components/Text/Text.tsx
interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  as?: 'span' | 'p' | 'div' | 'strong' | 'em' | 'small' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; // default span
  size?: ScaleProp; // font-size
  fontWeight?: ScaleProp;
  color?: 'less' | 'normal' | 'more' | string; // a CSS color for the escape hatch; a number is not pixels here
}
```

- **Every scale prop defaults to `normal`**, as Card's do, so a bare `<Text>` looks the same wherever
  it sits. It does not follow its parent: a Text inside a `size="more"` Banner is still `normal`
  unless it is given `size="more"` too, and in a Banner or Button `more`, whose text is white on the
  brand color, its `color` needs setting as well. `as` defaults to `span`.
- **No margin.** `Text` resets the browser's margin on `p` and headings: the space around text comes from
  the layout it sits in, as with Card. Spacing comes from Stack and Box, not from Text. A heading close
  to its own paragraph, and sections far apart, is a Stack inside a Stack with a bigger `gap`; a
  one-off is a `<Box marginTop="more">`. There are no margin props because vertical margin has no effect
  on the default inline `span`, and margin is Box's job (a margin on top of a Stack's `gap` also adds up
  rather than collapses).
- **`color` is a scale of how much the text stands out**, like Banner's `background`: `less` is quiet
  secondary text (`--color-text-less`, which the option
  descriptions and Select's empty message use too), `normal` is the plain text color (`CanvasText`),
  `more` is the brand color, for the one thing that should catch the eye (`--color-text-more`). The
  plain brand color is only 2.1:1 on white, so `more` is `--color-primary-strong`, which mixes 30% of
  the text color into it: 5:1 or better on a light and a dark page. It says nothing about meaning (error, success); that is an
  escape-hatch value, `color="var(--color-danger)"`. Any other string is a CSS color, set inline.
- **`fontWeight` as a number is unitless** (`700`, not `700px`), unlike the other props, where a number
  is pixels.
- `as` is for what the text _is_. Elements that are interactive or belong to a form (`label`, `a`,
  `button`) are other components' job.
- **Loading is the region's state, not a prop.** Text carries `_shared/Placeholder`: inside an element
  with `aria-busy="true"` (a Stack, a Card, or the Text itself) it becomes a quiet block as long as its
  content, with the text hidden. See Loading below.
- **Shared with Title** through `_shared/TypeFrame`: the element, the scale props and their defaults, the
  unitless weight, the margin reset and the `color` classes (`_shared/Type.module.css`), the placeholder
  and the ref. Text's own module is only its `size*` and `fontWeight*` classes. `as` still takes `h1`-`h6`,
  so existing headings keep working; a new heading is a Title.

### Title — Headings

`Title` is a heading: an `h2` unless `as` says otherwise. It has Text's props, read from its own tokens,
so headings get their own sizes, weights and typeface, and changing them doesn't move body text.

```tsx
// components/Title/Title.tsx
type TitleProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; // default h2
  size?: ScaleProp; // font-size, on --size-title-*
  fontWeight?: ScaleProp; // on --weight-title-*; a number is unitless, as Text's
  color?: 'less' | 'normal' | 'more' | string; // Text's scale (--color-text-*)
};
```

| Token                                       | Default               | What it is                           |
| ------------------------------------------- | --------------------- | ------------------------------------ |
| `--size-title-less` / `-normal` / `-more`   | 18px / 24px / 32-48px | `size`                               |
| `--weight-title-less` / `-normal` / `-more` | 400 / 600 / 700       | `fontWeight`                         |
| `--font-family-title`                       | `inherit` (no value)  | the typeface; unset, the font around |
| `--line-height-title`                       | 1.2                   | tighter than the body's 1.5          |

**Why a component**, when Text was meant to cover headings (`<Text as="h2" size="more" fontWeight="more">`):
Text's size scale stops at `--size-more` (1.25rem), which is body text, and it has no typeface of its own,
so a heading could only be made bigger or set in another font by changing the body scale, or one call at
a time with escape hatches. Title is the place to configure headings once.

Closest sibling is Text. **Shared**, through `_shared/TypeFrame`: everything in its section above
except the tokens. **What differs** is only `Title.module.css`: its `size*` and `fontWeight*` classes read
the title tokens, and `.title` sets the font family, the line height and `text-wrap: balance` (lines of
about the same length, not a long one and a stray word).

- **The level and the size are chosen apart.** `as` is where the section sits in the page's outline;
  `size` is how big it looks. Every prop defaults to `normal` whatever the level, so a bare Title looks
  the same everywhere, as a bare Text does; `h2` is the default because a page usually has one `h1`.
- **Headings only.** A Title is always a heading to assistive technology. Display text that is not a
  heading (a large number, a tagline) is a Text, with an escape-hatch `size`.
- **The sizes are ratios, each a step above the one below**, because a difference in size is seen as a
  ratio (16 to 18px shows; 40 to 42px doesn't):

  | `size`   | Value                                               | Step                        | For                                                                |
  | -------- | --------------------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
  | `less`   | `1.125rem` (18px)                                   | x1.125 over the body (16px) | a quiet heading: a group, a subsection                             |
  | `normal` | `1.5rem` (24px)                                     | x1.33 over `less`           | most titles: a section, a card, a dialog                           |
  | `more`   | `clamp(2rem, 1.25rem + 2.5vw, 3rem)` (32px to 48px) | x1.33 to x2 over `normal`   | the loud one, used sparingly: a page or hero title, an empty state |
  - `less` is close to the body text on purpose, for a heading that shouldn't be loud; its weight
    (semibold by default) does most of the work. It is not 20px: that is Text's `more` at the same
    weight, and 20 to 24px (x1.2) is too small a step for two heading levels to read as two. 18 to 24px
    (x1.33) is enough.
  - `normal` is 1.5 times the body, the usual proportion for a section or dialog title, and sits well in
    a card, a dialog and a page alike. (32px, the first value, shouted in a dialog.)
  - `more` is a different kind of type, not the next step, so it is the one that calls attention. It
    grows with the window: 32px up to 480px wide, 48px from 1120px, because a fixed 48px fills a phone
    screen with two lines. It follows the window, not the container, so it is for page-level titles; a
    card's title is `normal`.
  - **Zoom and `more`.** Browser zoom narrows the window in CSS pixels, so a fluid size grows less than
    the zoom: on a wide screen `more` is 1.5 times as big at 200% and twice as big at 300% (measured:
    48, 72 and 96 device pixels). Its largest is 1.5 times its smallest, under the 2.5 rule of thumb
    for fluid type, so twice the size is always reachable within the browsers' 500%; that is the common
    reading of WCAG 1.4.4 for fluid type. Any size that grows with the window falls short of twice at
    200% somewhere, so if your reading needs that, set `--size-title-more` to a fixed size (`2.5rem`).

  The values are plain, not aliases of `--size-*` / `--weight-*`: the point is that the two scales can
  move apart.

- **The typeface is a token, not a prop.** `fontFamily` has no less / normal / more, so it is
  `--font-family-title` (see [Font Tokens](#font-tokens)): on `:root` for the whole app, on any element
  for the titles inside it, or `style` / `className` for one. Its default, `inherit`, leaves it without a
  value (nothing above `:root` to inherit), so `font-family: var(--font-family-title)` falls back to
  inheriting: a title keeps the font around it, the body font (`--font-family-body`) unless something
  above it sets another. Setting only the body font changes the titles too.
- **A Text inside a Title keeps its own size, weight and color.** The title scale is classes on the
  heading, not custom properties it hands down, so in `<Title>Plans <Text color="more">from $5</Text></Title>`
  the Text is `normal` body size unless given a `size`, as anywhere. It does inherit the title's typeface
  and line height, as any inline text takes its parent's font.
- Dialog's and Drawer's titles are Titles (`_shared/ModalFrame`, at the default `normal` size), so a title font reaches
  them too. Banner's and Toast's headlines are not: they are a bolder first line of the message, in a
  `<p>`, not a heading of the page.

---

## Higher-Level Components

### Button

```tsx
interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'disabled'> {
  // Scale props (all optional, default = normal)
  size?: ScaleProp; // font-size; padding and gap are in em, so they follow it
  background?: ScaleProp; // --color-button-background-* tokens; normal is the primary color mixed with Canvas

  icon?: ReactNode; // shown before the children; with no children, the button is icon-only
  isDisabled?: boolean; // native `disabled`: not clickable, not focusable
  isLoading?: boolean; // spinner + aria-busy + aria-disabled; ignores clicks, stays focusable
  type?: 'button' | 'submit' | 'reset'; // defaults to 'button'
  onClick?: MouseEventHandler<HTMLButtonElement>;
}
// An `icon` with no children also requires `aria-label` or `aria-labelledby` (a type error without)
```

No `variant` and no `color` prop: every prop has exactly three predefined values plus the escape
hatch. `background="more"` is the brand-colored button, `background="less"` the transparent one.

Text is `CanvasText`, except on `background="more"`: there it is `--color-button-text-more`, an alias of
`--color-on-primary` (black or white, whichever contrasts with the primary), so a dark brand color
gets light text. A theme or consumer that recolors `--color-button-background-more` must set
`--color-button-text-more` with it (the dark theme does: its umber fill gets white). An escape-hatch
`background` string keeps `CanvasText`.

Border radius, font weight and box shadow are not props: the Button defines them itself in its CSS
module (currently placeholders on the `normal` tokens). Its shadow is the shared elevation scale, not
its own: `--elevation-normal` at rest, `-more` on hover, `-less` while pressed, so a theme that
changes `--elevation-*` changes Button with Card and the rest. Filled buttons (`normal`, `more`, and
an escape-hatch background) also get a 1px light line along the bottom edge, `--color-button-edge`,
drawn by `::before` so it doesn't depend on the elevation token; `background="less"` has none.

Boolean props use the `is*` prefix. While `isLoading`, the content stays in the layout (transparent)
so the button keeps its width and its accessible name. The spinner is the public `Spinner`, also used by
Select; Button only centers it.

**Icons.** `icon` (a `ReactNode`: an inline `<svg>`, an emoji, an `<img>`) goes in `_shared/OptionIcon`,
the same decorative `aria-hidden` square Select uses for an option's icon (1.25em, the height of a
line of text, with `currentColor` svgs following the button's text color). With children, it sits
before them, one `gap` away. Without children the button is **icon-only**: the horizontal padding
equals the vertical, so it is a square exactly as tall as a button with text, and every `size` and
`background` works as usual. Because an icon is decorative, the types require `aria-label` or
`aria-labelledby` on an icon-only button (the name is what the content would have been). The icon
slot's small downward nudge, which lines it up with a label, is turned off when there is no label.
There is no tooltip: a consumer who wants one wraps the button.

### Card

```tsx
interface CardProps {
  size?: ScaleProp; // Affects internal padding, font sizes
  borderRadius?: ScaleProp;
  boxShadow?: ScaleProp;
  padding?: ScaleProp; // Content padding
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
```

**Default appearance:**

```css
.card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-normal);
  box-shadow: var(--elevation-normal);
}
```

**Consumer creates variants via CSS:**

```css
.my-outlined-card {
  --color-card-bg: transparent;
  --color-card-border: var(--color-border-default);
  --elevation-normal: none;
}
.my-elevated-card {
  --color-card-bg: var(--color-bg-primary);
  --color-card-border: transparent;
  --elevation-normal: var(--elevation-more);
}
```

### TextField

```tsx
type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'color' | 'disabled' | 'readOnly' | 'required' | 'type'
> & {
  size?: ScaleProp; // font-size on the root; padding and gaps are in em, so they follow
  label?: string; // visible, above the field; without it aria-label/aria-labelledby is required
  tooltip?: ReactNode; // explains the field: an ⓘ button beside the label shows it (needs `label`)
  error?: string; // invalid state + message below the field; the caller decides when
  isDisabled?: boolean; // native `disabled`, dimmed
  isReadOnly?: boolean; // not editable, plain text: no fill, padding or focus border; tabIndex -1
  isRequired?: boolean; // native `required` + an aria-hidden asterisk after the label
} & (
    | { type?: 'text' | 'email' | 'search' | 'tel' | 'url' }
    | { type: 'password'; isRevealable?: boolean } // a show / hide button at the end of the field
    | { type: 'number'; hasSteppers?: boolean } // − and + buttons at the end; min / max / step are native
  );
```

`size` is the only scale prop: no `background`, no `borderRadius`. The field is a block of faint
color rather than a bordered box (easier to scan): `--color-field-background` is the brand
color at low alpha, so it lays over any surface in both themes. Hover steps the alpha up, focus
fades in a 2px inset-shadow border in the brand color (a transparent outline stays for forced-colors
mode), and the error state is the same fill in `--color-danger`, with a `--color-danger` focus border.
Because color alone can't carry the error, the message also gets an icon.

`size` is also the native character-width attribute of `<input>`, so the scale prop replaces it.
`className` and `style` go on the root (so `size` reaches the label and the message); `ref` and every
other native prop go to the `<input>`.

Based on NN/g and GOV.UK guidance: visible label above the field, no placeholder as label or hint,
required fields marked, error specific and below the field, validated when the user leaves the field
rather than on every keystroke (the component doesn't validate; see the `ValidateOnBlur` story).

**A `tooltip` on any labelled field or group** (TextField, Textarea, Select, Slider, FileUpload, DateField,
DatePicker, Checkbox, Radio, SegmentedControl) explains what it is for. Closest sibling for the build is
`_shared/FieldLabel`, which already draws every field's name; the two frames (`TextFieldFrame`,
`OptionGroupFrame`) pass `tooltip` to it, so a component adds nothing but the type, `FieldNameProps` in
place of `NameProps` (`_shared/types.ts`: `tooltip` exists only with a visible `label`). Toggle keeps
`NameProps`: its label is text beside the switch, not a `FieldLabel`.

- **The trigger is an ⓘ `IconButton` beside the label**, wrapped in the existing `Tooltip`; not the label
  itself, which is no tab stop, so the keyboard could not reach it. The button is a sibling of the
  `<label>`, never inside it, so the field's name stays "Name" and does not become "Name About Name". It is
  named `About <label>` (English, fixed, like "Show password"); the tooltip describes it, so the text is
  read after the name. Pressing it does nothing; hover and keyboard focus show the text.
- **A group's legend** then holds the label's text in a `<span>` and the button, and the `<fieldset>` gets
  `aria-labelledby` pointing at the span (the legend would otherwise name the group by the button too).
  A caller's own `aria-labelledby` wins. The button stays enabled in a disabled group: the browser does
  not disable controls inside a fieldset's first `<legend>`, and reading what a field is for is no edit.
- **Look.** The button's hit area is 1.5em round a 0.75em icon (`--icon-button-size` and
  `--icon-button-icon-size`, the hooks IconButton gives), pulled in with a negative block margin so the label's
  line keeps its height. The label's type stays on the text; the row is at the field's font-size, because the
  tooltip renders inside it and follows it. No new token.
- **Touch.** A tap does not show a tooltip (Tooltip's own limit: no hover, and a tap's focus is not
  `:focus-visible`), so on a touch screen the text is out of reach. Say what a person must know to fill the
  field in `label` or `error`, and use the tooltip for more. If that is not enough, a `Popover` trigger
  in `FieldLabel` is the change: the same button, opened by press.

**Password reveal and number** are variants of this component, not new ones: `type` unlocks the extra
prop, so `isRevealable` exists only on `type="password"` and `hasSteppers` only on `type="number"`. Both
are buttons inside the field at the inline end: `_shared/TextFieldFrame`'s `end` slot (a wrapper that
exists only when there are buttons, and `padding-inline-end` sized from `endCount`), filled with
`_shared/IconButton`s (the disc on hover, the shrink on press, `size` follows) and the icons in
`TextField/FieldIcons.tsx`.

- **`isRevealable`.** The button switches the input between `type="password"` and `type="text"` (the value, the caret and the
  focus stay). Its name changes with the state, "Show password" / "Hide password", and it has no
  `aria-pressed`, so it is not said twice. It is in the tab order (no other keyboard way to it); a
  mousedown on it is cancelled so a click keeps the focus in the input. It is disabled with the field and
  still works when read-only (showing is not editing). Opt-in: a password the user did not choose, or on
  a screen others can see, should not offer it.
- **`type="number"`** is the native `<input type="number">`: the spinbutton role, `min`, `max`, `step`,
  validity, the mobile keyboard and form submission are the browser's. The value stays a string and
  `onChange` gets the event as always (read `event.target.valueAsNumber`); a `number | null` API would be
  a separate component. The native spin buttons are hidden always (they cannot be themed and differ between browsers; the arrow
  keys still step), and digits are tabular.
- **`hasSteppers`** (off by default; the arrow keys always work) adds "Decrease" and "Increase" for the
  pointer. They call `stepDown()` / `stepUp()` on the input and dispatch an `input` event, so `onChange` fires
  and a controlled field gets the new value. A stepper is disabled when a step would not change the
  value (asked of a clone of the input, so `max`, `step` and an empty field follow the browser's rules,
  e.g. `max=10 step=3` stops at 9). They are out of the tab order (a spinbutton is one stop) and are not
  shown when read-only or with `step="any"` (`stepUp` throws there).
- Labels are English and fixed, like Select's "Clear".

**Not yet:** hint text under the field (a `tooltip` is behind a button; text that must always show is not), a clear button, a `labels` prop for the buttons,
press-and-hold to repeat a stepper, prefix / suffix text (a unit). Multiline is a separate component,
`Textarea`, not a mode of this one.

TextField renders only the `<input>`. The frame around it (root, `size`, label, error message, id and
`aria-describedby` wiring) and the look of the field are `_shared/TextFieldFrame`, shared with Textarea and Select;
its colors are the frame's (`--field-*`, from the shared `--color-field-background*`).
**Open:** a borderless faint fill may not meet WCAG 1.4.11 (3:1 for the control's boundary); check it
in Storybook, and add a stronger bottom edge if it needs one.

### Checkbox

```tsx
interface CheckboxOption {
  value: string;
  label: string;
  description?: string; // second line, linked with aria-describedby
  isDisabled?: boolean; // native `disabled` on that option
}

interface CheckboxProps extends Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'disabled' | 'name' | 'defaultValue' | 'color'
> {
  options: CheckboxOption[];
  value?: string[]; // controlled
  defaultValue?: string[]; // uncontrolled
  onChange?: (value: string[]) => void; // values in `options` order, not click order
  name?: string; // each checked input is submitted under it
  orientation?: 'horizontal' | 'vertical'; // defaults to 'vertical'
  minChecked?: number;
  maxChecked?: number;
  label?: string; // the <legend>; without it aria-label/aria-labelledby is required
  error?: string; // invalid state + message below the group; the caller decides when
  isDisabled?: boolean; // every option disabled, group dimmed
}
```

A group: a `<fieldset>` with one native `<input type="checkbox">` per option, so keyboard, form
submission and screen readers come for free. `className`, `style` and `ref` go on the fieldset.

**No scale props.** There is no `size`: everything is in `em`, so the group follows the font-size it
inherits. Row shape, fill and motion are fixed in the CSS module.

**`minChecked` / `maxChecked`** are enforced in the UI. Once `maxChecked` are checked the unchecked
options are blocked; once `minChecked` are checked the checked ones are. Blocked options get
`aria-disabled` and are dimmed but stay focusable (like Button's `isLoading`), as opposed to
`isDisabled`, which is native `disabled`. A checked disabled option counts toward both limits. A
`value` that already breaks a limit is not trimmed: report it through `error`. There is no built-in
hint text; say the limit in `label` ("Pick up to 2").

**Look.** Each option is a faint brand-alpha surface like TextField's (`--color-checkbox-background*`),
raised on hover like a Button: lift, a small scale (1.02, gentler than Button's since a row is wide),
a shadow that appears only on hover (options rest flat, like TextField), the sheen, and a pressed
state that settles back. The box keeps a visible border
(WCAG 1.4.11) and fills with the brand color when checked, with a tick that is
black or white, whichever contrasts more with `--color-primary` (`--color-checkbox-check`, an alias of
`--color-on-primary`, derived with `contrast-color()` and an OKLCH fallback, so a different primary adapts on its own). The error state is the same fill in `--color-danger` plus an icon.

The control itself (the rounded square, the brand fill and the tick that draws itself in) is
`_shared/CheckControl`, which Table's row selection uses too; it draws the tick in `--color-checkbox-check`
for both, so a checkbox looks the same wherever it is (a caller passes no color).

The group, option row, raised hover and error state are shared with Radio in
`components/_shared/OptionGroup.module.css`. A component sets `--option-background*` on its root from
its own `--color-<component>-*` tokens, and shapes the control itself.

**Open:** the raised-hover CSS is still a copy of Button's motion (as `--option-*` variables, on the
shared `--ease-*` curves). The hover scale and shadow strength want tuning in Storybook.

### Radio

```tsx
interface RadioOption {
  value: string;
  label: string;
  description?: string; // second line, linked with aria-describedby
  isDisabled?: boolean; // native `disabled` on that option
}

interface RadioProps extends Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'disabled' | 'name' | 'defaultValue' | 'color' | 'role'
> {
  options: RadioOption[];
  value?: string | null; // controlled; null = controlled with nothing selected
  defaultValue?: string; // uncontrolled
  onChange?: (value: string) => void;
  name?: string; // shared by the inputs; generated when left out
  orientation?: 'horizontal' | 'vertical'; // defaults to 'vertical'
  label?: string; // the <legend>; without it aria-label/aria-labelledby is required
  error?: string; // invalid state + message below the group; the caller decides when
  isDisabled?: boolean; // every option disabled, group dimmed
  isRequired?: boolean; // native `required` on the inputs + an aria-hidden asterisk after the label
}
```

Checkbox's single-select sibling: a `<fieldset role="radiogroup">` with one native
`<input type="radio">` per option. The shared `name` makes the browser do the rest (arrow keys move
and select, Tab treats the group as one stop, disabled options are skipped). `className`, `style`
and `ref` go on the fieldset. No scale props, same as Checkbox.

**Value.** `null` is the explicit "nothing selected" for a controlled group; `undefined` means
uncontrolled. `onChange` fires only when the selection changes. A user can't clear a radio, so
clearing is the caller's job (`value={null}`). There is no `minChecked` / `maxChecked` and no
blocked (`aria-disabled`) state: only native `disabled` applies.

**Look.** Same option rows as Checkbox (`--color-radio-*` tokens, aliases of the same `--color-field-*` values). The control is a
circle with a visible border (WCAG 1.4.11) that fills with the brand color when selected, with a dot
that scales in. The dot is black or white, whichever contrasts more with `--color-primary`
(`--color-radio-dot`, an alias of `--color-on-primary` like Checkbox's tick).

### SegmentedControl

```tsx
type SegmentOption = Omit<OptionBase, 'description'> & {
  icon?: ReactNode; // value, label, isDisabled? and: a glyph before the label (decorative)
};

type SegmentedControlProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'disabled' | 'name' | 'defaultValue' | 'color' | 'role' | 'children'
> & {
  options: SegmentOption[];
  value?: string | null; // controlled; null = controlled with nothing selected
  defaultValue?: string; // uncontrolled
  onChange?: (value: string) => void; // not called for the segment that is already selected
  name?: string; // shared by the inputs, and submitted with the form; generated when left out
  label?: string; // the <legend>; without it aria-label/aria-labelledby is required
  error?: string; // invalid state + message below the control; the caller decides when
  isDisabled?: boolean;
  isRequired?: boolean; // native `required` on the inputs + an aria-hidden asterisk after the label
  size?: ScaleProp; // font-size; default 'normal'
};
```

One value out of a few, always in view: a quick filter (All / Unread / Starred), a view (List / Grid), a
period. It changes a **value**; it is not navigation. When choosing shows a different panel of content,
that is [Tabs](#tabs); when the choices are a form's list with descriptions, [Radio](#radio); with more
than about five, [Select](#select); for several at once, selectable Chips.

Closest sibling is Radio, and it is the same thing drawn differently: a `<fieldset role="radiogroup">` with
one native `<input type="radio">` per option, so the browser does the keyboard (arrows move and select
together, wrapping; Tab treats the group as one stop), the form value and `required`. **Shared with
Radio:** `_shared/OptionGroupFrame` (the fieldset, legend, error message and the `aria-describedby`
wiring; it was copied between Checkbox and Radio until this third group component made it worth
extracting), `_shared/useChoice` (controlled by `value` / uncontrolled from `defaultValue`, `null` for
controlled and empty), `NameProps`, `OptionBase`, `name` generated from the id, `OptionIcon`. **Shared with
Tabs:** `_shared/SlidingThumb` (measures the selected segment and slides one thumb to it; Tabs' thumb
code was moved there) and `size` from `_shared/Size.module.css` (the only scale prop). **What differs:**
the options are not rows with a control and a description but segments in one track, and there is a
thumb.

**State.** Both controlled and uncontrolled, as Radio: it is an input with a form value, and a page that
filters by it keeps `value` itself. (Tabs is controlled-only because what it shows follows the selection;
here the control only holds a value and the page decides what to do with it.) A `value` that names no
segment selects none and has no thumb.

**Look.** An input, so it does not look like Tabs. The track is the field fill (`--color-segmented-background*`
alias `--color-field-background*`, with the error fill), pressed in with no shadow, and the thumb is the brand
color (`--color-segmented-thumb`, an alias of `--color-primary`) with `--color-segmented-text-selected` on it
(an alias of `--color-on-primary`), as a selected Chip and the current page of Pagination are. Tabs is a
frosted tray with a page-colored thumb, which reads as navigation. Unselected segments are
`--color-text-less`; under the pointer one takes the field's stronger tint (hover-capable pointers only).
**Motion** is the system's, as Pagination's and Button's: a segment springs to 1.06 on `--ease-enter` (500 ms, overshoots and
settles) and returns on `--ease-leave`; pressed, it shrinks to 0.95 in 120 ms with no overshoot. The thumb does the
same when the chosen segment is the one under the pointer or pressed (the same scale from the same middle, so the label stays
inside it), through `--thumb-scale` and its time and ease on `_shared/SlidingThumb`; at rest it is 1, so Tabs is
unaffected. With `prefers-reduced-motion` nothing scales and the thumb jumps. The
thumb's radius is the track's less its padding, so the curves are concentric, and it slides with the overlay's
springy `--ease-pop` curve. In `forced-colors` the selected segment gets a `Highlight` outline.
The dark theme sets the thumb and its text in `themes.css` (`tokens.test.ts` checks the two go together).

**Not yet:** a `vertical` orientation, a `fullWidth` control that spreads the segments across its box,
icon-only segments (a label that is visually hidden), a list wider than its box (it does not wrap or
scroll; keep to a few short labels), `description`, and a multiple-selection mode (use selectable Chips).

### Toggle

```tsx
interface ToggleProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'role'
  | 'checked'
  | 'defaultChecked'
  | 'onChange'
  | 'disabled'
  | 'value'
  | 'defaultValue'
  | 'required'
  | 'readOnly'
  | 'size'
  | 'color'
  | 'children'
> {
  label?: string; // the text beside the switch; without it aria-label/aria-labelledby is required
  description?: string; // second line, linked with aria-describedby
  checked?: boolean; // controlled
  defaultChecked?: boolean; // uncontrolled
  onChange?: (checked: boolean) => void;
  name?: string; // submitted while on
  value?: string; // submitted while on; the browser's `on` by default
  isDisabled?: boolean; // native `disabled`, dimmed
}
```

One setting that takes effect as soon as it is flipped: a native `<input type="checkbox" role="switch">`,
so keyboard (Space), form submission and screen readers come for free, announced as on / off.
**Single boolean on purpose.** For a choice that waits for Save or Submit, or for picking several from
a list, use Checkbox. A settings page is several Toggles; there is no `ToggleGroup`.

**Where the props go.** `ref`, `id` and the rest go on the `<input>`, as in TextField; `className` and
`style` go on the root `<label>`. No scale props, same as Checkbox and Radio.

**No `error` and no `isRequired`.** A switch is never "unanswered" or "wrong", and an error on one would
suggest it is a form value to validate. That is a Checkbox's job.

**Look.** Not the Checkbox / Radio option row: a Toggle is one setting, not a choice in a list, so
there is no surface behind it and the row doesn't lift. Hover answers on the control only: the thumb
grows and lifts, and an empty track warms up (`--color-toggle-background-hover`). The control is a pill
track with a visible border (WCAG 1.4.11) and a thumb that slides across it with the same spring as
Radio's dot. With `prefers-reduced-motion` the thumb jumps and doesn't grow.

**On and off are never a guess.** The state is said four ways, so no one has to read it from color:
position (thumb at the start / at the end), fill (empty track / brand-colored track), an icon on the
thumb (a cross when off, a tick when on), and the `switch` role, which a screen reader announces as
on / off. The thumb and its icon swap between `--color-primary` and `--color-toggle-thumb` (an alias of
`--color-on-primary`), so the icon always contrasts with the thumb it sits on.

The text beside it is `_shared/OptionText`, and the control is the same `.control` / `.input` /
`.mark` recipe in `_shared/OptionGroup.module.css` that Checkbox and Radio draw, resized; the
`.option` row is not used.

**Open:** the thumb moves with `translateX`, so it is not mirrored in right-to-left layouts.

### Slider

```tsx
interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'min'
  | 'max'
  | 'step'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'size'
  | 'color'
  | 'list'
  | 'children'
> {
  size?: ScaleProp; // font-size on the root, as TextField; the track and thumb are in em
  min?: number; // default 0
  max?: number; // default 100
  step?: number; // default 1; zero or negative falls back to it
  value?: number; // controlled
  defaultValue?: number; // uncontrolled; the middle of the track without it
  onChange?: (value: number) => void; // while it is dragged or keyed, not only on release
  formatValue?: (value: number) => string; // aria-valuetext: "30%", "Medium"
  label?: string; // as TextField; without it aria-label/aria-labelledby is required
  error?: string;
  isDisabled?: boolean;
}
```

One number picked from a range by dragging: a native `<input type="range">`, so the keys (arrows, Home,
End, Page Up/Down), touch, form submission (`name`) and the `slider` role are the browser's. For a number
that is typed or must be exact, use TextField with `type="number"`; for one of a few named choices,
SegmentedControl. Closest sibling is Toggle (a custom-drawn native input, the thumb's hover and press
motion), and the frame is `_shared/TextFieldFrame` (as Textarea and Select): root, `size`, label, error,
the id / `aria-invalid` / `aria-describedby` wiring and the disabled dimming. The one thing it does not
use is the frame's `className`, the look of a text field's filled box; the slider draws its own control
in `Slider.module.css`. `readOnly` and `required` are dropped from the props, since a range input has
neither, and there is no `isRequired` asterisk: a slider always has a value.

**One number draws the track.** Slider keeps the value in React (from `defaultValue` unless `value` is
given, so the fill can follow an uncontrolled slider too) and sets `--slider-value` (0-100) on the input,
as Progress sets `--progress-value`. The empty track is a `background-color` and the fill a gradient from
the brand color up to the thumb's centre (half a thumb in, since the centre travels the track's length
minus the thumb's width). The value is held to `min` / `max` and snapped to a step counted from `min`
before it is shown, with a tie rounded up, as the browser does; a sliding thumb and its fill are never
animated against each other, so the fill is always under the thumb. In a right-to-left page the input
runs from the right, and the gradient flips with `:dir(rtl)`.

**Look and motion.** A pill track 0.5em thick and a 1.25em disc in a 1.75em-tall input, so there is room
for a finger. Hover answers on the whole control, as Toggle's does: the thumb grows to 1.15 on
`--ease-enter` (500ms, overshoots and settles) and lifts on `--elevation-normal`, and the empty track
warms up. Pressed, and held while dragging, the thumb settles to 0.95 in 150ms on `--ease-leave` and
drops its shadow; that is not gated on hover, since a finger presses too. Hover is gated on `(hover:
hover)`; `prefers-reduced-motion` keeps the colors and drops the scale. The timing is a `--thumb-transition`
custom property set per state on the input, which both browsers' thumb pseudo-elements read, so the two
rules (`::-webkit-slider-thumb`, `::-moz-range-thumb`, which can't share a selector list) stay short.
Focus is a 2px `CanvasText` outline around the thumb, not the input.

**Colors.** Aliases only: the track is the field fill (`--color-slider-track*`, with the error pair),
the fill the brand color (`--color-slider-fill`), the thumb the strong brand color
(`--color-slider-thumb`, an alias of `--color-primary-strong`: the plain primary is 2.1:1 on white and the
thumb is what shows where the value is), and an error recolors the fill and thumb to
`--color-slider-error` (an alias of `--color-danger`). The error also shows as a message with its icon, as
in every field, so color is not the only cue. The empty track at 15% is faint on white by the same choice
as the other fields; the value stays readable from the thumb's place and `aria-valuenow`.

**Not yet:** a visible value (a bubble over the thumb, or beside the label: until then, show it from the
parent's state), tick marks, a range with two thumbs, a vertical orientation, `onChangeEnd` for a costly
update (the native `change` event fires on release; React's `onChange` is the `input` event), and a
`prefers-contrast` / forced-colors treatment of the track.

### Textarea

```tsx
interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'color' | 'disabled' | 'readOnly' | 'required'
> {
  size?: ScaleProp; // font-size on the root, as TextField
  rows?: number; // visible rows; default 3
  resize?: 'none' | 'vertical'; // default 'vertical'; horizontal is left out, the field fills its container
  label?: string; // as TextField
  error?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean; // as TextField, and the resize handle is dropped
  isRequired?: boolean;
}
```

A separate component from TextField because the element, its `ref` type and its props differ (`rows`,
`resize`, no `type`). Everything else is the same, and shared through `_shared/TextFieldFrame`: the
look (fill, hover, focus border, read-only, disabled, error), the label and error wiring, `size`, and
`className`/`style` on the root. Its colors are the frame's, from the shared field fill.

**Not yet:** auto-grow (`field-sizing: content`), character counter.

### Select

```tsx
type SelectOption = OptionBase & { icon?: ReactNode }; // value, label, description?, icon?, isDisabled?

type SelectProps = Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'defaultValue' | 'color' | 'role' | 'children'
> &
  NameProps & {
    options: SelectOption[];
    name?: string; // hidden input(s) submit the value(s) under it
    size?: ScaleProp; // font-size on the root, as TextField
    label?: string; // without it aria-label/aria-labelledby is required
    error?: string; // invalid state + message below the field; the caller decides when
    placeholder?: string; // shown while nothing is selected; not a label or a hint
    isLoading?: boolean; // a spinner in the chevron's place; "Loading…" for an empty list, aria-busy and no Enter-to-pick for a stale one
    isDisabled?: boolean;
    isRequired?: boolean; // aria-required + an aria-hidden asterisk; NOT native `required`
  } & (
    | {
        isSearchable?: boolean; // the control is an input that filters the options
        onSearch?: undefined;
      }
    | {
        isSearchable?: true; // implied: `isSearchable={false}` with `onSearch` is a type error
        onSearch: (query: string) => void; // the caller searches; `options` are the matches, not filtered
      }
  ) &
  (
    | {
        isMultiple?: false;
        isClearable?: false;
        value?: string | null; // controlled; null = controlled with nothing selected
        defaultValue?: string;
        onChange?: (value: string) => void; // only when the selection changes
      }
    | {
        isMultiple?: false;
        isClearable: true; // a button clears the value; hidden while required or disabled
        value?: string | null;
        defaultValue?: string;
        onChange?: (value: string | null) => void; // null = the user cleared it
      }
    | {
        isMultiple: true;
        isClearable?: boolean; // a button removes every chip that can be removed
        value?: string[]; // controlled
        defaultValue?: string[];
        onChange?: (value: string[]) => void; // values in `options` order, not click order
      }
  );
```

**One component, not a Select and an Autocomplete.** Other libraries split them and leave developers to
guess which to use. The line that matters is whether the value is **constrained to the options** or
**free text** (the W3C APG separates a select-only combobox from an editable one on exactly that), not
whether the user can search. So `Select` keeps the value one of the options in every mode, and search
is `isSearchable`: the typed text only filters, and goes back to the selected label when the list
closes. Fewer than about 5 options are better as a `Radio` (or a `Checkbox` group for several); where
search starts to pay off is reported anywhere from 8 to 15 options, so no threshold is built in.

**Two switches, four shapes.** `ref` goes to the combobox element: a `<button role="combobox">` for a
plain single Select, an `<input role="combobox">` when searchable. A multiple Select is a box (the
control, with the field's fill) holding the chips and an `<input role="combobox">` that is read-only
unless `isSearchable` (`inputMode="none"`, so no touch keyboard). A chip's remove button can't live
inside a `<button>`, and the input gives the label, `aria-activedescendant` and the placeholder one
home. `className` and `style` go on the root, as TextField; the other native props go to the combobox
element.

**Keyboard** (APG): ArrowDown / ArrowUp open and move the active option, skipping disabled ones, and
stop at the ends; Home / End (not when searchable, which keeps them for the caret); Escape closes
without changing anything; blur closes. Not searchable: typing jumps to the label that starts with the
typed text (the buffer resets after 500 ms; a repeated first letter cycles); Enter or Space commits
and closes (a multiple one toggles and stays open); Tab commits a single one, as APG select-only does.
Searchable: typing filters ("contains", ignoring case and diacritics) and the first match is active;
Enter commits. A multiple one clears the query after each pick. In a multiple one, Backspace in an
empty input removes the last chip that can be removed. A click anywhere on a removable chip removes it
(the whole chip is the hover target: it takes `--color-chip-hover` and the × scales up; a disabled
option's chip stays and has no ×, and Backspace skips it); its button is
the accessible name and is out of the tab order (`isInField`), so the field is one Tab stop.

**Async search.** `onSearch` is for options fetched by what is typed. One prop, not an `isAsync` flag
next to `isSearchable`: a flag would be meaningless without `isSearchable` (a button has no text to
search), and one prop can't be set to a state that doesn't exist, so `onSearch` implies a searchable
input and the types reject `isSearchable={false}` with it. What it changes, and only that:

- **No local filtering.** `options` are the caller's matches, shown whatever they matched on (an email
  that isn't in the label, a fuzzy hit). The hook's `visible` skips `filterOptions`.
- **The text is reported.** `onSearch(text)` on every change, and `onSearch('')` when the text is
  reset (the list closes, or a multiple Select clears it after a pick), and only if there was text.
  That is where the caller brings its default suggestions back. Debounce and abort are the caller's:
  they depend on the API, and `Select.stories.tsx` has a `useSearch` that does both.
- **Selected options are remembered.** `selectedOptions = options.filter(…)` would lose the value the
  moment a new result set lacks it, so the Select keeps the option objects it has seen selected
  (and records one when it is picked, since the caller may swap the list in the same update). A value
  that is selected on first render has never been seen, so its option has to be in `options` once.
- **Pick order.** Without `onSearch`, a multiple Select reports values in `options` order. Across
  searches there is no stable `options` order (and chips that reshuffle as the user types are worse),
  so with it chips stay where they are and a new pick goes last.

`isLoading` is independent of it and works on any Select. The field shows `Spinner` (the ring
Button uses) in the chevron's corner, which fades out under it but stays mounted, so it doesn't jump
back to its open or closed angle afterwards; the field's width and text don't move. The ring is the
cue for sighted users whatever the list holds; it is `aria-hidden`, like Button's. For assistive tech:
while `options` is empty the popup says "Loading…" in place of "No results"; while it isn't, the stale
list stays (blanking it on every keystroke flickers) with `aria-busy` on the listbox, and Enter doesn't
take its first option, since the user hasn't seen the list they are about to pick from. Clicking is
still allowed: they can see it.

**Clearable.** Off by default, as in most libraries: a plain single Select is expected to always have a
value, and a required one must not offer to empty itself, so `isRequired` and `isDisabled` hide the
button. It sits beside the chevron (`aria-label="Clear"`, out of the tab order like a chip's button,
× scales up on hover), and the field keeps room for it whether or not it is showing, so text doesn't
shift when a value is picked. It clears what can be cleared: a disabled option stays, as for
Backspace. Keyboard: Backspace with nothing typed clears a non-searchable single Select (a multiple
one already removes the last chip); a searchable single one clears when its text is emptied. The ×
is `_shared/CrossIcon`, shared with the chip, Banner's and Toast's dismiss buttons and the close button of Dialog and Drawer (all `_shared/CloseButton`, an `_shared/IconButton`).

**Value.** Like Radio (`null` is the explicit empty value) for a single one, like Checkbox (`string[]`,
options order) for a multiple one. The user can't clear a single Select unless `isClearable`, which
reports `null`; otherwise clearing is the caller's (`value={null}`). `name` renders hidden inputs, since there is no native control: one for a single,
one per value for a multiple. Only values that are options count.

**Popup.** A `popover="manual"` element in the top layer, so no ancestor's `overflow` clips it and no
`z-index` is needed, placed with CSS anchor positioning: under the field, as wide as it, flipped above
when there is no room. It is rendered while open and for 200 ms after (see Motion), so it can animate
out. It stays a DOM child of the root, so `size` reaches it. Light dismiss is ours (blur, Escape), so focus never leaves the control, and a mousedown
in the popup is cancelled. The popup is an [overlay](#overlay): everything that knows it is a popover
is `_shared/useOverlay.ts` and `_shared/Overlay.module.css` (shared with Tooltip); `Select.module.css`
only says where it sits (`position-area`, width) and which colors the list reads. There is no fallback for a
browser without the Popover API and anchor positioning.

**Motion.** The same organic principle as Button (springy on the way in, no overshoot on the way
out; `--ease-enter` / `--ease-leave` in `theme/tokens.css`):

- **The popup** grows out of the field: it starts at 0.94 scale and 0.5em toward the field (the other
  way when it flips above, from the bottom edge; `useOverlay` sets `data-side`), overshoots its
  size by about 3% and settles in 450 ms while its shadow lifts from `--elevation-less` to `-more`.
  Opacity has its own plain 150 ms fade, so it doesn't follow the overshoot. Closing is a quicker
  150 ms (to 0.97 scale, no overshoot) and the popup is `aria-hidden` while it leaves.
- **The active option** (pointer or keyboard) fills in over 60 ms, fades out over 140 ms, and grows by
  1.5% on the springy `--ease-enter` (300 ms; it overshoots by a hair and settles), shrinking back
  without overshoot on `--ease-leave` (200 ms). That is Button's hover motion at a fraction of the size:
  no lift and no shadow, since a row in a list isn't a card of its own as a Checkbox option is, and
  small enough to stay inside the popup's padding. Pure CSS (the transition that runs is the
  destination state's). Quick in so the row answers the pointer as it arrives; slower out so the row it
  left fades behind it, a short trail. Tried and dropped: a 150 ms fade-in trails the pointer and feels
  sluggish; a hard cut in with a 220 ms trail dazzles when sweeping; one highlight gliding between rows
  keeps travelling after the pointer stops, which feels like overshooting, and needs a script to
  measure the rows; a full Checkbox-style raise (lift, 1.02 scale, shadow, sheen) is too much when
  moving over several options. Under `prefers-reduced-motion` the fill is the only cue.
- **The chevron** turns with the gentler `--ease-pop` overshoot when opening and settles when closing.
  It also grows (`--scale-icon-hover`, `--ease-pop`) while the pointer is over the control. The chips' and
  the clear button's × grow by the same token when they are hovered.
- `prefers-reduced-motion`: the popup only fades (100 ms), nothing scales or lifts, and the chevron
  jumps.

**Look.** The TextField's fill block (`--color-select-*`, aliases of the shared field fill) with a
chevron that turns when open. The popup is a frosted `--color-select-popup` surface (translucent, with the page blurred behind it; see Overlay) with
`--elevation-more`; the active option uses `--color-select-option-active`. A selected option in a
single Select has a tick after its text; in a multiple one each option is a Checkbox-style box with a
tick (`--color-select-check`), so selection is never color alone. A chip is the public
[Chip](#chip), removable, at the field's own size (`size="1em"`) and with the removable fill
(`--color-chip-background-removable`, the stronger field tint, over the field's own fill), with a
remove button (`aria-label="Remove <label>"`). A disabled option's chip, or any chip in a disabled
field, is `isDisabled`: dimmed, with no ×.

Shared with TextField, Textarea and Slider through `_shared/TextFieldFrame`: root, `size`, label, error, the
id / `aria-invalid` / `aria-describedby` wiring and the look of the control. The frame's focus border
also matches `:has(:focus-visible)`, so the multiple box shows it when its input is focused. The
option text is `_shared/OptionText`, and `SelectOption` is `OptionBase`. The popup's surface and rows
are `_shared/OptionList.module.css` (see [Menu](#menu)), and the pure helpers of the keyboard model
(`stepEnabled`, `findByPrefix`, the type-ahead) are `_shared/optionNavigation`. The rest of the
navigation (`useListboxNavigation`: the active option, the query, `aria-activedescendant`) stays in
`Select/`, since only a combobox keeps focus on the control. The chip was
`SelectChip`, private to Select, and is now the public `Chip`, which Select renders.

**Option icons.** `SelectOption.icon` (a `ReactNode`: a flag, an avatar, a logo) is shown before the
option's text, in the three places a Select shows an option: the popup row, the closed field of a
single Select and a chip. It is decorative: `_shared/OptionIcon` wraps it in an `aria-hidden` square
(`--option-icon-size`, 1.25em; a chip sets 1em), so `label` stays the accessible name and a row's name
doesn't change. An `<img>` or `<svg>` child fills the square; round or otherwise shaped images are the
caller's own `border-radius`. Only Select has it: Checkbox and Radio options are `OptionBase`, and
adding `icon` there is one prop passed to `OptionText`. In
a searchable single Select the field is an `<input>`, which can't hold an element, so the icon is
positioned over it (the input gets a start padding while it is shown) and is removed, with the
padding, while the text is being typed, since it no longer names the selection.
There is no `renderOption`: a row is always `OptionText` (label, description, icon) so the `option`
semantics and `aria-activedescendant` can't be broken by custom content. Add one if an icon isn't
enough (a badge on the right, say), replacing only the row's content.

**Not yet:** a clear button, `minSelected` / `maxSelected` (Checkbox has `minChecked` / `maxChecked`),
option groups, creating an option, a custom `filter`, loading options when the list opens (not by
typing: needs an `onOpen`, and `onSearch` doesn't cover a non-searchable Select), paging a long result
list, localisation of "No results", "Loading…" and "Remove <label>".

**Open:**

- `isRequired` is `aria-required` only: a form's own validation (`checkValidity()`) doesn't see it.
  A visually hidden native input or `ElementInternals` would.
- "No results" is a `role="status"` that appears with the popup, which screen readers may not
  announce; check in a screen reader pass. The same goes for announcing a chip's removal.
- Support for the Popover API (Chrome 114, Firefox 125, Safari 17) and anchor positioning (Chrome 125,
  Safari 26, Firefox 147) was checked on 2026-11-02: every engine ships both, so there is no fallback.
  The library also relies on `corner-shape` and `contrast-color()`, which are newer; check them
  before release.
- The borderless fill and WCAG 1.4.11, as TextField.

### Banner

```tsx
type BannerProps = Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'title'> & {
  size?: ScaleProp; // font-size; padding and gaps are in em, so they follow it
  background?: ScaleProp; // --color-banner-background-*: how loudly it speaks, in the brand color
  title?: string; // a short headline above the message, in heavier type
  onDismiss?: () => void; // shows the × button and calls this when it is pressed
  // children: the message (any content, so a link or a Button goes inside)
};
```

An announcement in the flow of the page, not a status message. Researched against Carbon's inline
notification, GOV.UK's notification banner and the W3C alert pattern: it sits where it concerns, stays
until dismissed or resolved, and doesn't float, stack or time out (a toast is a different component,
see [Toast](#toast)). Called Banner, not Alert, because it announces rather than warns.

**`background` is intensity, not a kind of message.** It is named for what it sets, as in Button, so an
escape-hatch value reads naturally (`background="linear-gradient(...)"`) instead of a "severity" that
is really a CSS background. There is no info / success / warning / error:
a Banner that needs to say which does so in its words. (Validation errors stay on the field, as
GOV.UK advises, not in a banner.)
`less` is the faint brand tint (`--color-banner-background-less`, an alias of the field fill), `normal`
is the opaque tint (`--color-primary-tint`, shared with Button's `normal`) and `more` is the brand
color itself, with `--color-banner-text-more` (an alias of `--color-on-primary`) for its text. A banner is flat: no shadow
on any background. As in Button, a theme that recolors the `more` background sets its text with it
(the dark theme does: umber and white). An escape-hatch `background` is any CSS value, and keeps
`CanvasText`. Because the scale is only strength of the same hue, nothing in it relies on a color
difference: the words carry the meaning.

**Glow.** A static decoration on every banner: a soft pool in the top-left corner, in the **opposite
of the text color** (`--color-banner-glow`, an alias of `--color-text-inverse`: white behind black
text, black behind white), 20% alpha at the corner, fading to nothing by 11em. Drawn by
`.banner::before` (a `radial-gradient`) behind the content. No markup and no motion, so nothing to
pause or reduce. In `em`, so it follows `size`; clipped to the banner's rounded corners. It lightens
under dark text and darkens under light text, so it always contrasts with the words, but on a dark
background the darkening has little room to show. Chosen from a set of static corner effects
(ripple, sheen, dots, grid, stripes, ...); the ripple was tried first and dropped for being busier
than the rest of the library.

**Dismiss.** `onDismiss` renders `_shared/CloseButton` named "Dismiss" (a real `<button>` with `_shared/CrossIcon`), in
the tab order (unlike a Select chip's: a banner is not inside a field). On hover the × grows, as
Select's, over a faint disc of the text color (10%); when pressed the whole button shrinks (0.8,
quick, no overshoot), so the disc and the × go down together, and the disc deepens (20%). With `prefers-reduced-motion` only the disc remains. The hit area is 1.75em around a 1em ×. The Banner doesn't hide itself: the caller stops
rendering it and decides whether it comes back, so the state stays one place. The button's look is
`_shared/CloseButton`'s, shared with Toast's dismiss and the close button of Dialog and Drawer; Banner supplies only its margin.

**Role.** `role="status"` (a polite live region), so a banner rendered after the page has loaded is
announced without moving focus, as the W3C alert pattern advises. One already on the page at load is
not announced, which is right for a persistent notice. Pass `role="alert"` for something urgent; it is
a plain native prop. `className`, `style`, `ref` and the other native props go on the root `<div>`.

**Not yet:** an icon or leading slot, an action slot (put a link or a Button in the children for now),
enter / leave motion, localisation of "Dismiss", a sticky or full-width variant.

### Avatar

```tsx
type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & {
  size?: ScaleProp; // font-size; the box is 2.5em square, so it, its contents and the text beside it follow
  src?: string; // the picture; while it loads, and if it fails, the fallback shows
  name?: string; // whose it is: the initials, the background color, and the accessible name unless `alt` says otherwise
  isTextShown?: boolean; // writes the name and the description beside the circle (OptionText); the only switch
  alt?: string; // the accessible name when it differs from `name`; alt="" makes it decorative
  // children: the fallback in place of the initials and the glyph (an icon, a logo's letter)
} & (
    | { description?: undefined }
    | { description: string; name: string } // under the name, smaller and quieter; needs a name
  );
```

A person's or an account's picture in a circle. Not interactive: wrap it in a link or a button when it
should be. Closest sibling is Banner (a `size` over the brand's look, flat, no shadow), but it differs
in the one place that matters: there is **no `background` prop**. The color is a function of `name`, so
the same person is the same color everywhere, with nothing for the caller to keep in step.

**Color from the name.** `getHue(name)` hashes the name (FNV-1a over its code points, after trimming,
collapsing spaces and lowercasing, so "Ada Lovelace" and " ada lovelace" agree) to a hue in 0-359.
Avatar sets it on its root as `--avatar-hue`; the CSS makes the color
`oklch(var(--color-avatar-lightness) var(--color-avatar-chroma) var(--avatar-hue))`. Lightness (0.82)
and chroma (0.08) are the same for every avatar, in `tokens.css`, so they carry the same weight and sit
well with the sand brand color; a pastel, so the text is black. The dark theme sets lightness to 0.45
and the text turns white without being told: it is `oklch(clamp(0, (0.6 - lightness) * 1000, 1) 0 0)`,
the `--color-on-primary` rule fed the lightness, written in the CSS module because it needs the value
as it is on the avatar. The tokens are plain numbers, not colors, because the hue isn't known in
`:root`. No name (or only spaces) means no hue: the avatar takes `--color-avatar-anonymous`, an
alias of the field fill, with `CanvasText`. To pick another hue, set `--avatar-hue` (0-359) in `style`:
it is on the root and the caller's `style` is merged last, so it wins, with or without a written name.
No new color recipe is in `tokens.css`, so the duplicate-recipe test has nothing to say.

**Name and description.** Closest sibling here is Toggle (and the options of Checkbox, Radio and
Select): a control with a label and a smaller, quieter description beside it. That is
`_shared/OptionText`, so Avatar renders it rather than its own text styles: the name in the text color,
the description at 0.875em in `--color-text-less`, 0.125em apart. What differs is only where the text
comes from: the avatar already has a `name` (for the initials, the color and the accessible name), so
there is no second `label` prop that could disagree with it.

**One switch.** `isTextShown` is the only thing that decides whether the name and the description are
written beside the circle; the two are shown or hidden together, and nothing is implied by having a
`description`. Without it the circle stands alone. The type still requires a `name` for a `description`
to sit under, and a blank name writes nothing. The tooltip is the other half of the switch and is not
built yet: when it is, `isTextShown={false}` will put the same name and description in a tooltip on the
circle, so the information is there either way. Until then they are not shown at all, and no native
`title` stands in (it would have to be taken out later, and `title` is the caller's own attribute). The
text is beside the circle, not under it, and the description is under the name: the layout of a comment,
a list row and a menu header. `size` scales all of it, since the gap and the description are in em. With
text, the root is a row (`.withText`) holding the size class, the hue, `className`, `style` and the ref,
around the circle (`.avatar`); without, the circle is the root.

**Fallback order:** the picture once it has loaded; otherwise `children`; otherwise the initials of
`name` (first letter of the first and last words, so "Ada Lovelace" is AL and "ada" is A; whole code
points, so an emoji isn't split); otherwise a plain person glyph. The fallback sits under the picture
while it loads (the `<img>` is transparent until `load`, so a half-drawn or broken picture is never
seen) and is removed once the picture is in, so a transparent PNG doesn't show it through. A failed
load keeps the fallback; a new `src` starts over. The load state is tagged with the `src` it belongs to,
so there is no effect to reset it. An image already complete when React attaches (cached,
server-rendered) is picked up in the `<img>`'s ref callback.

**Accessible name.** The circle is `role="img"` named by `alt ?? name`; the `<img>` inside has `alt=""` so
the name isn't said twice. With no name at all, and no `aria-label` / `aria-labelledby` from the caller,
it is `aria-hidden`, since an unnamed image would only be noise. When the name is written beside it
(`isTextShown`) the circle is `aria-hidden` too, unless the caller passes a non-empty
`alt`, because a screen reader reads the name in the text. `alt=""` is the way to say "decorative" when
you write the name yourself.

**Size.** The box is `2.5em`, `flex: none` (never squeezed into an oval by a flex or grid parent) and
`overflow: hidden`. The shape (a circle) and the weight are fixed, as Button's radius is.

**Loading.** Inside `aria-busy="true"` the circle becomes the placeholder block (its picture, initials and
glyph hidden, the circle kept) and so do the name and the description beside it (they are `OptionText`).
Pass a placeholder `name` such as "Loading name" while the data is on its way. See Loading below.

**Not yet:** the tooltip that shows the name and description when `isTextShown` is off (waits for
Tooltip), the text under the circle instead of beside it (an `orientation`, as Checkbox and Radio
have), a shape prop (rounded square), a group that overlaps avatars (`AvatarGroup` with a +N),
a status dot as a prop (wrap it in `<Indicator overlap="circle" label="Online">` instead), `loading` / `crossOrigin` on the `<img>`, a way to pick the
colors a name maps to (a palette, rather than a free hue).

### Chip

```tsx
type ChipProps = StaticChipProps | RemovableChipProps | SelectableChipProps; // one of three, never mixed

type ChipBase = {
  size?: ScaleProp; // font-size; the pill is 2em tall, so height, padding and gaps follow it
  children: string; // the label; a removable chip's × is named after it ("Remove <label>")
  icon?: ReactNode; // before the label (OptionIcon); a selected chip shows a ✓ here instead
};

type StaticChipProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'children'> & ChipBase; // no handler, no isDisabled

type RemovableChipProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'children'> &
  ChipBase & {
    onRemove: () => void; // adds the × and makes the whole chip the click target
    isInField?: boolean; // inside a field that is one Tab stop (Select): the × leaves the tab order
    isDisabled?: boolean; // dimmed, no hover or press, no ×
  };

type SelectableChipProps = Omit<
  ButtonHTMLAttributes<HTMLElement>,
  'color' | 'children' | 'type' | 'disabled' | 'aria-pressed'
> &
  ChipBase & {
    isSelected: boolean; // controlled; also `aria-pressed`
    onSelectedChange: (isSelected: boolean) => void; // called with the opposite on click
    isDisabled?: boolean; // dimmed, natively disabled
  };
```

A small pill. With no handler it is a **label**: a status word ("Beta"), a category, a keyword. With
`onRemove` it is a **value the user can take out**; with `isSelected` and `onSelectedChange` it is a
**choice the user switches on and off**. It is not the notification dot or count (that is
`Indicator`). It is Select's former `SelectChip`, made public when a second use was in view.
It was briefly split into a `Tag` (the label) and a `Chip`; the two shared everything but a border
color, and a semantic name for a label was not worth a second component, so they are one again. **The
rule that tells a label from a control: an outline is information, a fill is something you can
press.** This library's fields, Checkbox, Radio, Toggle and Button are all filled, so a fill already
means "pressable".

| Kind                 | Fill                                                                               | Border      | Extras                 | Element                          |
| -------------------- | ---------------------------------------------------------------------------------- | ----------- | ---------------------- | -------------------------------- |
| Static (no handler)  | none                                                                               | 1px brand   | no hover or press      | `span`                           |
| Removable            | `--color-chip-background-removable` (alias of the field hover tint, 25%)           | transparent | ×, wash and shrink     | `span` with a `button` ×         |
| Selectable, off      | `--color-chip-background-selectable` (alias of the field fill)                     | transparent | wash and shrink        | `button`, `aria-pressed="false"` |
| Selectable, selected | `--color-chip-background-selected` (the brand color), `--color-chip-text-selected` | transparent | ✓ in place of the icon | `button`, `aria-pressed="true"`  |

The static outline is `--color-chip-border` (the brand color). Selectable off and selected are the
Checkbox and Toggle pair (field fill off, brand color on). The selected pair is overridden together in
the dark theme (a test checks it), as Banner's and Button's. A chip is flat: no shadow in any state.
Every chip has a 1px border, transparent but for the static one's, so all the kinds are the same size
and sit level in a row.

**One of three.** `onRemove` and `isSelected` / `onSelectedChange` are exclusive in the types: a ×
inside a toggle button is a button in a button, and a click on the body would be ambiguous.
`isSelected` needs `onSelectedChange`, because a selectable chip without a handler would be a button
that does nothing, or a selected state shown by color alone. A static chip has no `isDisabled`: a
label that does nothing cannot be disabled.

**Removing.** `onRemove` adds a real `<button aria-label="Remove <label>">` with `_shared/CrossIcon`
and makes the whole chip the target: a click anywhere on it calls `onRemove`, the click is marked
handled (`preventDefault`, so a field around it does not also act on it), and mousedown is cancelled
(so a field around it keeps focus). The chip does not hide itself: the caller stops rendering it. The
button is a Tab stop by default, so a keyboard can remove a standalone chip (Enter or Space on the
button); `isInField` takes it out of the order for Select, where the field is one Tab stop and
Backspace removes the last chip. The focus ring is on the ×, the only thing a keyboard reaches.

**Selecting.** A selectable chip is a real `<button type="button" aria-pressed>`; the whole chip is
the target and the focus ring goes around the whole chip (`outline: 2px solid CanvasText`, as Button
and Toggle). It does not flip itself: it asks for the opposite state and follows `isSelected`. A
selected chip shows a `_shared/CheckIcon` in the icon's slot, so selection is never color alone. A
chip with no icon gets wider when selected (the ✓ and its gap), so a wrapping row can reflow on a
click; Material's filter chip does the same. Controlled only for now.

**Hover and press** (the two filled kinds, `.interactive`). Hover is a wash over the chip (`::after`,
12% brand tint, `--color-chip-hover`; the text color at 15% on a selected chip, which is already the
brand color) and the × grows (`--scale-icon-hover`). **Pressed** (`:active`, outside the hover query
so a tap on touch shows it) deepens the wash (24%, `--color-chip-pressed`; 28% of the text color when
selected) and shrinks the whole chip to 0.95, quickly and without overshoot, as Banner's dismiss
button does; the × gives up its hover growth so it ends at the chip's scale. With
`prefers-reduced-motion` the motion is off and the deeper wash alone shows the press. The wash is a
layer on top, not a second background, so it works on every fill. It is a different motion from
Button's (lift and grow), which is part of what tells them apart.

**Disabled.** `isDisabled` dims the chip to 0.5, as Button does, with no hover, press or pointer
cursor. A removable one has no × and does not call `onRemove`; a selectable one is natively
`disabled` and keeps its selected look and ✓. Select uses it for a disabled option or a disabled
field; a disabled field is already dimmed as a whole, so Select's CSS keeps its chips from dimming a
second time. A locked chip stays filled rather than turning into a static (outlined) one.

**Shape and size.** The pill is 2em tall (so a Select field with chips and an empty one are equally
tall as a TextField), with `border-radius: 1em`, half the height, so the ends are semicircles. Round
arcs, not the squircle Button and Card have, which with the lower height, the lighter weight and the
lack of a shadow is how a chip reads as not-a-button. `borderRadius` and `background` are not props:
the shape and the fills are the component's. Override with `className` or `style`, or with the tokens.
The label is set at 0.875em of the chip's `size` (the ratio of an option's description), so the text
sits in more room while the pill keeps its height and padding. A long label is truncated before the ×
is. With a ×, the end padding is `0.375em - 1px`, so the × is as far from the curve as from the top
and bottom.

`_shared/CheckIcon` is the ✓ of Checkbox, Toggle, Select's options and Chip, drawn with attributes
like `CrossIcon`.

**Not yet:** a leading status dot, status colors for a label (success, error, warning), an
uncontrolled selectable chip (`defaultSelected`), a chip group (single or multiple selection, a
toolbar's arrow keys), a link chip (wrap it for now), localisation of "Remove".

### Spinner

```tsx
type SpinnerProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & {
  size?: ScaleProp; // font-size; the ring is 1em square. No default: unset, it follows the surrounding text
};
```

The loading ring, for work of unknown length. It was `_shared/Spinner` (Button, Select); it is public
now, with the same CSS, so their positioning is unchanged. Closest sibling is Avatar (a `size` that only
sets font-size over a box in em); what differs is the default. `size` has **no default**: a spinner in a
Button or a line of text must be as big as that text, so unset it is `1em`, not `normal`. It takes the
text color (`currentColor`). Pass `size` to free it from the text, with the three variants or an
escape-hatch value.

**Accessible name.** Decorative until named. Button and Select say what is loading with `aria-busy` or a
status, so their ring is `aria-hidden` (no name). Standing alone, give it `aria-label` or
`aria-labelledby` and it becomes `role="progressbar"` with **no `aria-valuenow`**, which is how ARIA
says "in progress, how far unknown". There is no `label` prop: it would only repeat `aria-label`.

**Drawing and motion.** An SVG arc (`_shared/Ring`, shared with Progress's determinate circle), 4 of
32 units thick, the same as the border ring it replaced, so Button's and Select's positioning is
unchanged. Two motions with periods that don't match: the whole ring turns steadily (1.6s, linear) while
the arc breathes (2.2s, ease-in-out). Its head runs ahead to a 70% arc and its tail catches up, then it
shrinks to a dot, so the arc stretches and shrinks as it turns and is never twice in the same place at
the same length. Round caps. The animation is on `stroke-dasharray` / `stroke-dashoffset` of a circle
whose `pathLength` is 100, so the numbers are percentages. Its resting style (what shows with the
animation off) is a ring with a gap, as before. `prefers-reduced-motion` slows the turn to 4s and holds
the arc; `styles.css`'s global reduced-motion rule goes further and stops both.

**Size classes.** `size` is its only scale prop, so it passes `_shared/Size.module.css` (`sizeLess` /
`sizeNormal` / `sizeMore`) to `resolveScaleProps` instead of copying them into its own module. Progress
does the same.

**Not yet:** a label beside the ring ("Loading…"), a color prop, a delay before it appears (so a fast
load doesn't flash it).

### Progress

```tsx
type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'> & {
  size?: ScaleProp; // font-size; the bar's thickness (0.5em) and the circle's diameter (2.5em) follow
  shape?: 'bar' | 'circle'; // default 'bar'
  value?: number; // 0 to max, held to it; absent or not finite: indeterminate
  max?: number; // default 100; zero or negative falls back to it
} & ({ 'aria-label': string } | { 'aria-labelledby': string }); // must be named
```

How far a task has got. Closest sibling is Spinner, which it uses: an indeterminate **circle is the
Spinner**, so there is one turning ring in the library. What differs from Spinner is the known value,
the track, and the bar. Spinner is for a wait with no end in sight and no room for a bar.

**One number draws both shapes.** Progress sets `--progress-value` (0-100, `value / max`) on its root;
the bar's fill is `width: calc(var(--progress-value) * 1%)` and the circle's arc is
`stroke-dasharray: var(--progress-value) 100` on a circle with `pathLength="100"`, started at 12 o'clock.
A caller's `style` is merged last, so it can override the property. Both ease to a new value in 300ms
with `--ease-leave`, which does not overshoot: a bar that overshoots shows more done than there is.
The circle's thickness is 4 of 32 units, an eighth of its width, the same as Spinner's border.

**Indeterminate.** No `value` (or `NaN` / `Infinity`): no `aria-valuenow`, and `.indeterminate` is set.
The bar has two segments (the second fainter, `.trail`), each moving by its own `inset-inline-start` and
`-end` on its own curve: the head runs ahead and the tail catches up, so each stretches and shrinks as it
crosses, and the second starts 1.15s later, so the two overlap and part. (Animating insets is layout, on
an element a few pixels high; it also mirrors in a right-to-left page.) The circle renders Spinner (its
breathing arc) at 2.5em over an inset shadow in the track color, so the gap in the ring shows the track
as the finished ring does. Under `prefers-reduced-motion` the bar becomes a still, half-strength full bar
("in progress" without moving).

**Moving to a new value.** The time is `--progress-duration`, set on the root from the distance moved: 180ms
plus 6ms per percent, at most 780ms. A one-percent tick settles quickly and a jump across the bar is
followed by the eye. The previous percent is kept in state and replaced while rendering (React re-renders
before drawing), so the first frame of a move already has its duration; an effect would be a frame late.
From or to indeterminate there is no distance and it is 300ms. The easing is `--ease-leave`; the caller's
`style` can override `--progress-duration`.

**Finishing.** Arriving at the end _from below_ adds `.finished` (the state is `isFinished`, kept with the
previous percent): the fill brightens and settles once, and the ring also swells 8% on `--ease-pop`. It
starts at 80% of the move's duration, so it marks the arrival, not the departure. A progress that is full
on first render, one held at the end by a value above `max`, and one going indeterminate do not play it;
leaving the end and arriving again does. Off under `prefers-reduced-motion`.

**Accessible name.** `role="progressbar"` with `aria-valuemin=0`, `aria-valuemax` and `aria-valuenow`
(the held value), named by `aria-label` or `aria-labelledby`, which the types require, as an icon-only
Button's do. There is no visible `label` prop. `aria-valuetext` passes through for a value in words ("3
of 12 files"). It is not a live region: announce milestones some other way.

**Colors.** Both come from `--color-primary` directly, not through a field token: the fill is the primary
itself, and the track is the primary at 20% over transparent. The 20% is deliberately not the field
fill's 15% or 25%, so Progress doesn't move when the fields do, and `tokens.test.ts` (which rejects the
same recipe under two names) has nothing to say. The sand primary is
2.1:1 on white, below the 3:1 that WCAG asks of a graphic; how far along it is stays readable from the
filled length and `aria-valuenow`, not from color alone. A theme that needs more contrast sets
`--color-progress-fill`. The shape (a pill, a ring) is fixed, not a prop.

**Not yet:** a visible label and percentage (`isValueShown`), content in the middle of the circle, a
buffer segment (a second, lighter value), segments, `color` for success or error, a determinate
`shape="circle"` that can start from another angle, a `onFinished` callback (announce it yourself).

### Divider

```tsx
type DividerProps = Omit<HTMLAttributes<HTMLHRElement>, 'children' | 'color'> & {
  orientation?: 'horizontal' | 'vertical'; // default 'horizontal'
};
```

A hairline between two groups. It is meant to be felt more than seen: one pixel, in `--color-divider`,
an alias of the shared `--color-line`: the brand color at 35% over transparent (more than Progress's 20%
track only because a one-pixel line needs more alpha than a filled bar to show). That is the one new color
recipe; there was no faint line to alias (`--color-text-less` is 70% of the text color,
`--color-chip-border` the full brand color). It was first defined under Divider's own name; Table's row
rules were the second consumer, so the recipe got a neutral name and both alias it.

Closest sibling is Card, for the rule that it has **no margin**: the space on either side is the
layout's (a Stack's `gap`, or a wrapping Box), so it is not a Box and takes none of Box's props. It is
an `<hr>`, a separator already, drawn as its background with the border and margin reset; sizes are
logical (`block-size` / `inline-size`), so it reads the same right-to-left. `align-self: stretch` makes
it span a Stack on the cross axis whatever the Stack's `align` (a column with `align="center"` would
otherwise collapse it to nothing); a vertical one in a row stretches to the row's height, with a `1em`
minimum for when it sits outside a flex container.

`orientation="vertical"` adds `aria-orientation="vertical"` (a horizontal one needs nothing).

**Not yet:** a label in the middle ("or"), a decorative-only mode (`role="presentation"`), a `strength`
or `color` prop, a dashed style.

### Indicator

```tsx
type IndicatorProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'children'> & {
  children: ReactNode; // what the mark is pinned to
  count?: number; // absent: a dot. 0 (or less) shows nothing unless isZeroShown
  max?: number; // default 99; above it the mark reads "99+"; zero or negative falls back to it
  isZeroShown?: boolean;
  isHidden?: boolean; // takes the mark away; the children stay mounted
  corner?: 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'; // default 'top-end'; logical
  overlap?: 'rectangle' | 'circle'; // the shape of what is wrapped; default 'rectangle'
  size?: ScaleProp; // font-size of the mark; the dot, the count's height and its padding follow
  label?: string; // what assistive tech hears; without it the mark is decorative
};
```

A dot or a count pinned to a corner of what it wraps: an unread "3", an online dot. Closest sibling is
Chip: the same pill-ended count, flat and in the brand color, smaller. What differs is that it hangs off
something else, so it wraps a child, and it has no kinds. It is **not a Box**: Box is a block-level `div`
with padding and margin props, and the wrapper here is an inline box that hugs its child (`inline-flex`,
`vertical-align: middle`) and takes none of them.

**Not red, on purpose.** Red is the convention (Material's badge defaults to its error color; Shopify's
POS badge calls red its "critical" tone; the Ontario design system keeps red for alerts), and that is
the reason to leave it: a red mark says "something is wrong, hurry", and a count of unread messages is
not that. Used on everything, it also stops being seen; Braze calls it "red dot blindness". Here the mark
says "something is here", and gets noticed by being a mark on a corner and by arriving with a pop, not by
alarm. A library with no `info` / `error` kinds on Banner has no status colors to pick from either.

**Why not `--color-primary` itself.** The sand primary is 2.09:1 on white, below the 3:1 that WCAG asks of
a graphic, and a dot is the whole message, not a decoration beside text as Progress's fill is. (It is
fine on a dark page, 9:1.) The fill is `--color-indicator-background`, an alias of
`--color-primary-strong`: the primary mixed 30% toward the text color, 5.1:1 on white and 11.4:1 on dark.
That recipe used to be written inside `--color-text-more`; it is now its own shared token, named for what
it is rather than for one consumer, and Text's `more` aliases it too. So a component token never points
at another component's or role's token, and the recipe is still defined once (`tokens.test.ts` has
nothing to say). The digits are `--color-indicator-text: Canvas`: the page color
contrasts with the fill as much in either theme, so `themes.css` has nothing to override. A theme that
sets the fill to something else sets the text with it. To use the plain primary, set
`--color-indicator-background: var(--color-primary)` and `--color-indicator-text: var(--color-on-primary)`.

**The mark.** It has no ring (an earlier version had a 2px cut-out in the page color): the shadow and the
shade lift it off what it overlaps, and a ring would have to be set to the surface behind it to look
right. The shadow is `--elevation-normal`, the library's middle step, with no token of its own
(`--elevation-less` is 6% alpha and does not show on a mark this small; a custom shadow was tried and
dropped). The fill is lit from above: a gradient runs top to bottom over
`--color-indicator-background` from white at 22%, gone by 45%, to black at 22%. Those two are written in
`Indicator.module.css`, not as tokens: they are the mark's finish, not a color anyone customises, and as a
layer over the fill they survive a theme that changes the fill. The highlight fades out
before the digits, which sit in the middle, and the shade only deepens the fill under them: white digits on
the light page gain contrast, and dark digits on the dark page keep 8:1 or better. A dot is `0.625em`; a
count is `1.25em` tall with `0.3em` side padding and semicircular ends, its digits at `0.75em`, weight
`more`, tabular. It arrives with a 300ms scale from zero on `--ease-pop` (the gentle overshoot the library
uses for small marks) and leaves with a 180ms scale to zero on `--ease-leave`, which does not overshoot:
nothing grows on the way out. Both are off under `prefers-reduced-motion` through `styles.css`'s global rule. It
takes no pointer events, so a click lands on what it wraps. `size` sets the font-size of the **mark**
(`_shared/Size.module.css`), not the root, so a bigger indicator does not enlarge the wrapped text.

**Why `corner`, not `placement`.** `placement` means an edge (`top` / `bottom`) everywhere else, paired with
`align` (Tooltip, Popover, Select, Menu, Toast, through [Overlay](#overlay)). Here the value is one of four
corners, which is one thing and not an edge plus an alignment: splitting it would add an `align` with a
`center` the mark never has. So it has its own name, and `placement` is left to mean the edge.

**The corner is two nested boxes, not a transform.** A zero-size anchor (`position: absolute`) sits on the
corner by logical insets (`inset-block-start`, `inset-inline-end`, ...), and the mark is centered on it by
the anchor's flexbox, overflowing equally every way. So the corner mirrors in a right-to-left page (a
`translate(50%, -50%)` would not), and a wider count needs no offset to know its own width.
`overlap="circle"` moves the anchor 14.6% in from each edge: a circle's corner is inside its bounding box,
and that puts the center of the mark on the rim at 45°. Use it for an Avatar (without `isTextShown`: with
the name beside it, the Avatar is wider than its circle and the mark goes to the corner of both).

**Count.** `count` set means a number; a count that is not finite is a dot. `0` and below show nothing,
because there is nothing to count, unless `isZeroShown`. Above `max` the mark reads `max+`. `isHidden`
removes the mark and leaves the children mounted, so toggling it does not remount what is wrapped.

**Leaving.** The mark is not unmounted the moment it is told to go. What it draws (`{ text }`) is kept in
state and replaced while rendering, as Progress keeps its previous percent; when `isHidden` turns on or
the count falls to 0, `.leaving` swaps the pop for the shrink and the mark keeps showing what it last
showed (a "3" does not turn into an empty dot on the way out). `onAnimationEnd` of the leave unmounts it.
A leaving mark is `aria-hidden` at once: it is already gone for assistive tech. Showing again before it
has gone drops `.leaving`, which restarts the pop. A count that changes while shown updates in place and
plays nothing. A mark that starts hidden is never drawn. If the animation never runs (the page is not
rendered), the invisible mark stays mounted, scaled to zero and hidden from assistive tech.

**Accessible name.** Decorative until named, as Spinner is. With `label`, the mark is `role="img"` with
that name ("3 unread messages", "Online"); without it, it is `aria-hidden`, because a dot would say
nothing and a bare "3" next to "Inbox" is not a sentence. Name it, or say it where the wrapped content is
named (`<Button aria-label="Inbox, 3 unread">`). It is not a live region: announce a change some other way.

**Not yet:** a text label ("New"), a colour for another meaning (there is deliberately none), a bump when
the count changes, a `Tooltip`, wrapping Avatar's name and circle separately, a
`offset` for fine placement.

### Overlay

`_shared/useOverlay.ts` and `_shared/Overlay.module.css`: what Select's popup, Tooltip, Popover, Menu and
Dialog share, and what the rest will. Extracted from Select's former `useSelectPopup` when Tooltip became
the second consumer. Toast takes only the CSS (through `floatingClass`): its viewport is not an overlay
with a trigger, so it has no use for the hook.

```tsx
const overlay = useOverlay({
  isModal, // a modal <dialog> (Dialog), not an anchored popover; default false
  isEscapeClosing, // close on Escape anywhere; default false
  isOutsideClosing, // close on a press or focus outside the overlay and its anchor; default false
  isFocusReturned, // on close, focus inside it goes back to the anchor; default false
  isOpen, // controlled: leave out and it keeps its own state
  defaultIsOpen, // starts open, when uncontrolled; default false
  onOpenChange, // (isOpen) => void, called when open or close changes it
});
// isOpen, isPresent, open, close, toggle, overlayRef, anchorRef, anchorStyle, overlayProps
<button ref={overlay.anchorRef} style={overlay.anchorStyle} />;
{
  overlay.isPresent && (
    <div {...overlay.overlayProps} className={clsx(overlayClass('bottom'), styles.mine)} />
  );
}
```

The hook owns the open state and showing (`showPopover()` on a `popover="manual"` element in the top
layer; with `isModal`, `showModal()` on a `<dialog>`), the 200 ms it is kept mounted to animate out (`data-state="closed"`, `aria-hidden`), the anchor
name (generated; `anchor-name` on the anchor, `position-anchor` on the overlay, both inline), and
`data-side`, read after placement to tell whether it flipped above. `Overlay.module.css` owns the rest:
`inset: auto`, the gap to the anchor (`--overlay-offset`, default 0.375em), the fallbacks when it
overflows (`flip-block`, then `flip-inline`, then both; these are the `anchored` class, which a modal
doesn't take), the six placement classes below, and the
motion described under Select's Motion. Every overlay is frosted glass: the consumer's background token aliases `--color-overlay-background` (the page color at 60%), and `Overlay.module.css` blurs what is behind it (`backdrop-filter`, a fixed finish, not a token). It also owns the finish that was
repeated in each consumer: `box-sizing`, no border, `--radius-normal` squircle corners (`--overlay-radius` overrides it), `font: inherit`,
and the 1px `CanvasText` border under `forced-colors`. A consumer adds only its size, padding,
background token and shadow (and its own `position-area`, if it places itself as Select's popup does).
The `--overlay-radius`, `--overlay-offset` and `--overlay-shift` hooks are registered with `@property` as
not inherited: an overlay is a DOM child of its consumer, so otherwise a Select's popup inside a Dialog
would take the Dialog's rounder corners, and one inside a Popover its gap.
This pair is the one place that knows an overlay is a popover; replace it to change how overlays are
shown or placed (floating-ui). The overlay stays a DOM child of its consumer, so font size reaches it.

**Placement.** `_shared/Overlay.ts` exports `overlayClass(placement, align = 'center')`, which returns
the `overlay` and `anchored` classes and one of `top`, `topStart`, `topEnd`, `bottom`, `bottomStart`, `bottomEnd` from
`Overlay.module.css`, and the types `OverlayPlacement` (`'top' | 'bottom'`) and `OverlayAlign`
(`'start' | 'center' | 'end'`). Tooltip, Popover and Menu pass their props to it, so the six `position-area`
values are written once. They are logical: `start` puts the overlay's start edge on the anchor's
(`block-end span-inline-end`), `end` puts the end edges together (`span-inline-start`), `center` centers
it on the anchor. The overlay flips to the other side when it doesn't fit (`data-side` follows), and to
the other edge when it overflows the side of the viewport; the inline fallback is not checked in a
browser yet. `floatingClass` is the `overlay` class alone, for an overlay that is placed by something
else (Toast): the finish and motion, none of `anchored`, `modal` or the six placements. A consumer that
sets `data-side` chooses which edge it grows from.

**Dismissal is opt-in, and each option is the whole of its behavior.** Light dismiss is never the native
one (`popover="auto"`): the consumer decides what closes it, so Select and Tooltip, which turn nothing on
here, are closed only by their own handlers.

- `isEscapeClosing`: a `keydown` listener on the document while open (Tooltip, Popover, Menu, Dialog).
  Only the overlay opened last closes (a stack of the listening ones), and none does when a control
  already used the key (`defaultPrevented`, as Select's does to close its popup), so Escape in a Menu
  inside a Dialog closes the Menu, and the next Escape closes the Dialog.
- `isOutsideClosing`: while open, a capture-phase `pointerdown` and a `focusin` on the document close it
  when the target is in neither the overlay nor the anchor. The anchor is excluded because its own press
  toggles; closing on it too would close and reopen. Capture, so a handler inside that stops the event
  can't hide it. Select doesn't need it: its focus stays on the control, so a blur already says it.
  A Popover's content takes focus, so a blur can't tell "outside" from "inside".
- `isFocusReturned`: when it goes from open to closed, if focus is inside the overlay (still mounted,
  leaving) or has fallen to `document.body`, focus goes to the anchor, or, for a modal with none, to what
  had focus when it opened (if that is still in the page). A modal does this once it is gone, not when it
  starts to leave: the page is inert until then, and an inert element can't take focus. Not after a press outside
  (`pointerdown` marks it): focus goes where that press went. Focus elsewhere is left alone.
- `isOpen` / `defaultIsOpen` / `onOpenChange`: controlled or not. Controlled, `open()` and `close()` only
  call `onOpenChange`; the state is the prop, so a caller that doesn't follow keeps the overlay as it
  was. Leaving (the exit animation) starts in the render where `isOpen` turns false, whoever changed it.

- `isModal`: the overlay is a `<dialog>` shown with `showModal()`. The rest of the page is inert (which is
  the focus trap: Tab cycles inside, and to the browser's own UI), the browser draws `::backdrop`, and
  there is no anchor to place it against (`overlayProps` has no `popover` and no `position-anchor`). The
  browser's own Escape (`cancel`) is prevented and `isEscapeClosing` closes it instead, so it keeps its
  exit animation and a controlled caller can refuse. It stays modal while it leaves, which is why focus
  return waits. `Overlay.module.css`'s `modal` class (`modalClass` in `Overlay.ts`) grows it from its
  middle, and the `overlay` classes fade the backdrop with it; the consumer sets the backdrop's color.
  A modal docked to an edge (Drawer) takes `dockedClass(edge)` instead: the same classes plus
  `slideStart` / `slideEnd` / `slideTop` / `slideBottom`, which set `--overlay-slide-from` (the off-screen
  `translate`; `start` and `end` swap under `:dir(rtl)`). It slides in over 450ms with a spring of its own,
  `cubic-bezier(0.34, 1.35, 0.64, 1)`, not `--ease-enter`: that overshoots by almost half of the ~26em
  it travels, far past its edge. This overshoots by ~3.5% (under the 1em gap), so the panel moves into the
  gap beside the edge and settles back. It leaves in 150ms with `--ease-leave`, and the panel itself doesn't fade (the backdrop does). It starts its own size plus
  2em out, so a floating panel's gap and its shadow are off-screen too. The slide is inside
  `prefers-reduced-motion: no-preference`, so reduced motion keeps the overlay's plain fade.

**Not yet:** nested overlays beyond Escape (a press in a child overlay counts as outside its
parent), `popover="auto"`.

### Tooltip

```tsx
type TooltipProps = {
  children: ReactElement; // the trigger: one element that takes ref, style and pointer / focus handlers
  content: ReactNode;
  placement?: 'top' | 'bottom'; // default 'top'; flips when there is no room
  delay?: number; // ms the pointer rests before it shows; default 0 (at once). Keyboard focus is always at once
  isDisabled?: boolean; // renders the trigger alone
};
```

Closest sibling is Select's popup, through [Overlay](#overlay): the same top-layer placement and
grow-out motion. It differs in what opens it (a resting pointer or keyboard focus, not a control's own
keys), in having no width tie to the anchor, and in its surface. It wraps nothing: it clones the trigger
to add the anchor name, handlers and `aria-describedby`, and composes with the trigger's own `ref`,
`style` and handlers. (A wrapper element would change the trigger's layout, and `display: contents`
can't be an anchor.)

**Behavior.** Shows at once when the pointer arrives, or after `delay` of resting if one is set (a touch
pointer never shows it: there is no hover), and at once on keyboard focus (`:focus-visible` only, so a click's focus doesn't show it). Hides on pointer
leave (after 100 ms, so the pointer can cross the gap and rest on the tooltip, WCAG 1.4.13), on blur, on
Escape and when the trigger is pressed. It is `role="tooltip"` and the trigger gets `aria-describedby`
only while it is shown: it describes, it doesn't name, so an icon button still needs an `aria-label`.

**Look.** Text color on the overlay's frosted page-colored background (`--color-tooltip-background`
aliases `--color-overlay-background`; `--color-tooltip-text: CanvasText`: black on white, white on black
in dark mode), 0.875em, `--elevation-normal`, at most 20em wide. Motion is the overlay's.

**Not yet:** an `align` (Popover has one; `overlayClass` already takes it, so it is a prop and a story),
a touch way to show it (press and hold), a shared delay so moving between triggers shows
the next at once, a `size` prop, an arrow, Avatar's use of it for `isTextShown={false}`, a disabled
trigger (the browser sends it no pointer events).

### Popover

```tsx
type PopoverProps = ({ 'aria-label': string } | { 'aria-labelledby': string }) & {
  trigger: ReactElement; // one element that takes ref, style and onClick
  children: ReactNode; // what it holds: text, a form, buttons
  placement?: 'top' | 'bottom'; // default 'bottom'; flips when there is no room
  align?: 'start' | 'center' | 'end'; // which edge of the trigger; default 'center'; logical (RTL-aware)
  isOpen?: boolean; // controlled; pair with onOpenChange
  defaultIsOpen?: boolean; // starts open, when uncontrolled
  onOpenChange?: (isOpen: boolean) => void;
  className?: string; // on the panel; for `--popover-max-height` (default 24em, past which it scrolls)
};
```

**The content is `children` and the trigger is a prop**, the reverse of Tooltip. A popover's content is a
layout (a form, a list of actions), often dozens of lines, and reads as JSX children; a trigger is one
element and reads fine as a prop. A tooltip's content is a short string, so there it is the prop and
the trigger stays the child. A compound `Popover.Trigger` / `Popover.Content` would let the trigger live
away from the anchor, which nothing needs yet; the rest of the library takes flat props.

Closest sibling is Tooltip, through [Overlay](#overlay). Shared: the overlay's placement (`placement`
and `align` through `overlayClass`), motion and frosted surface, `--overlay-offset`, the cloned trigger
(no wrapper; `_shared/useTriggerRef` composes the trigger's own `ref` with the anchor, extracted from
Tooltip when Popover became its second user), and Escape. What differs: it opens on the trigger's press, not a resting pointer; it holds content a person
acts on, so it can be pressed and tabbed into; it takes focus and gives it back; and an outside press
closes it. Closest on the _state_ side is Select's popup, which is also open-by-press, but Select's focus
never leaves the control.

**Behavior.** Pressing the trigger toggles it (a trigger `onClick` that calls `preventDefault` does not).
It closes on Escape, on a press or focus outside it and its trigger, and on the trigger again. Opening it
from the trigger moves focus to the panel (`tabIndex={-1}`, so Tab goes on into the content, which follows
the trigger in the DOM); a popover that starts open, or that a caller opens, does not take focus. Closing
it with focus inside, or lost to the page, returns focus to the trigger, and a press elsewhere does not
(focus goes where it was pressed). It is not modal: no `aria-modal`, no focus trap, the page stays live.

**Accessibility.** The panel is `role="dialog"` and must be named (`aria-label` or `aria-labelledby`,
required by the type). The trigger gets `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls`
while open.

**Look.** Content on the overlay's frosted page-colored background (`--color-popover-background` aliases
`--color-overlay-background`), 1em padding, `--elevation-more` as Select's popup, at most 24em wide and
tall (it scrolls past that). Centered on the trigger by default, as Tooltip is; `align` moves it to the
trigger's start or end edge. Motion is the overlay's.

**Not yet:** an arrow, `size`, a `Portal` (it is a DOM child of the trigger's parent, so `overflow` does
not clip it in the top layer, but a `transform` ancestor changes how it is placed), a focus trap (use
Dialog), nested popovers, opening on hover, a way to move focus to a chosen element inside.

### Menu

```tsx
type MenuItem = OptionBase & { icon?: ReactNode }; // value, label, description?, icon?, isDisabled?

type MenuProps = {
  trigger: ReactElement; // one element that takes ref, style, id, onClick and onKeyDown; it names the menu
  items: MenuItem[];
  onSelect: (value: string) => void; // called with the chosen item's value; the menu then closes
  placement?: 'top' | 'bottom'; // default 'bottom'; flips when there is no room
  align?: 'start' | 'center' | 'end'; // which edge of the trigger; default 'start'; logical (RTL-aware)
  isOpen?: boolean; // controlled; pair with onOpenChange
  defaultIsOpen?: boolean; // starts open, when uncontrolled
  onOpenChange?: (isOpen: boolean) => void;
};
```

A list of **actions**: choose one and the menu closes. Choosing a _value_ is Select; a panel of anything
is Popover. Items are data (`items`, as Select's `options`), not children, so the keyboard model and
the roles can't be broken by custom content; a row is always `OptionText` (label, description, icon).

Closest siblings are Select's popup and options, and Popover. **From Popover**, through
[Overlay](#overlay): `useOverlay` with Escape, outside-press and focus return all on, the cloned
trigger (no wrapper; `_shared/useTriggerRef`, and its `TriggerProps` type, now shared with Popover),
`overlayClass(placement, align)`, motion and the frosted surface. **From Select**: the rows and
surface (`_shared/OptionList.module.css`, extracted from Select's CSS in this change: the popup's
padding, scrolling and shadow, the column of rows, and a row with its active fill and motion; the
consumer sets `--list-background` and `--list-active` from its own tokens), `OptionText`, and the
keyboard helpers (`_shared/optionNavigation`: `stepEnabled`, `findByPrefix`, and `useTypeahead`, which
was Select's inline type-ahead). **What differs:** focus. Select's stays on the combobox and the active
row is `aria-activedescendant`; a menu's moves onto its items (APG menu button), so the rows are real
`<button role="menuitem" tabIndex={-1}>`s, and the active row _is_ the focused one. There is no state
for it, and the shared row style lights `:focus` as well as Select's `data-active`. Choosing calls
`onSelect` rather than setting a value, and the trigger opens it with the arrow keys.

**Behavior.** Pressing the trigger toggles it. Opened by the keyboard (Enter or Space; a click with no
`detail`), focus lands on the first item; opened by a pointer it lands on the panel (`tabIndex={-1}`),
with nothing lit under a pointer that isn't on a row. On the trigger, ↓ opens it on the first item and ↑
on the last (↓ or ↑ on an open menu moves focus in). Inside: ↑ ↓ step over disabled items and stop at
the ends (as Select's, no wrap), Home and End go to the first and last enabled item, typing jumps to a
label that starts with it (a Space is text while typing, and chooses the item otherwise), the pointer
moving over a row focuses it, Enter, Space or a click chooses, Tab closes it. Escape, a press or focus
outside, and the trigger again close it too; closing with focus inside returns focus to the trigger, and
a press elsewhere does not (focus goes where it was pressed). A menu that starts open, or that a caller
opens, does not take focus.

**Accessibility.** The panel is `role="menu"`, named by the trigger (`aria-labelledby`: the trigger's
own `id`, or one the menu gives it), so an icon-only trigger needs an `aria-label`. The trigger gets
`aria-haspopup="menu"`, `aria-expanded` and, while open, `aria-controls`. Rows are `menuitem`s;
`description` is linked with `aria-describedby`; a disabled item is a `disabled` button, so it is
skipped and can't be chosen. The icon is decorative.

**Look.** The overlay's frosted page-colored background (`--color-menu-background` aliases
`--color-overlay-background`), `--elevation-more`, at least 10em and at most 24em wide, scrolling past
20em. The active row is `--color-menu-item-active` (an alias of the field hover fill, as
`--color-select-option-active`) and grows by 1.5%; under `forced-colors` it gets a `Highlight` outline.
Motion is the overlay's.

**Not yet:** separators and groups (a `Divider` between sections, a heading), checkable items
(`menuitemcheckbox` / `menuitemradio`), submenus, an item that is a link, a destructive style, wrapping
at the ends, a shortcut hint, `size`, opening on right-click (a context menu), a `Portal`.

### Dialog

```tsx
type DialogProps = (
  | { title: string } // the visible heading; it names the dialog
  | { title?: undefined; 'aria-label': string }
  | { title?: undefined; 'aria-labelledby': string }
) & {
  trigger?: ReactElement; // one element that takes ref and onClick; leave it out to open from state
  children: ReactNode;
  actions?: ReactNode; // the row of buttons under the content, end-aligned
  'aria-describedby'?: string; // for a confirmation: the element that says what is asked
  isBackdropClosing?: boolean; // a press on the backdrop closes it; default true
  isCloseButtonShown?: boolean; // the × at the top right; default true
  isOpen?: boolean; // controlled; pair with onOpenChange
  defaultIsOpen?: boolean; // starts open, when uncontrolled
  onOpenChange?: (isOpen: boolean) => void;
};
```

A modal dialog: a window the person deals with before going back to the page.

**The name is `Dialog`, not `Modal`.** What libraries call it, from Open UI's component research for
some and from knowledge for the rest (not a full survey): Radix, shadcn/ui, MUI, Chakra (v3), Primer,
Base UI, Headless UI and Material Components Web say Dialog; Ant Design, Bootstrap, Carbon, Mantine,
Polaris and Lightning Design System say Modal. The platform is on the Dialog side: `<dialog>`,
`role="dialog"`, the APG pattern "Dialog (Modal)". There "modal" is a _mode_ of a dialog, not a second
kind of thing (`showModal()` against `show()`, `:modal`, `aria-modal`). That settles it here, because
Popover already is a non-modal `role="dialog"`: calling this one Modal would give the same ARIA role two
words. `Dialog` is the modal one and Popover the non-modal one. A side panel is the same dialog in
another place (Drawer, below), not another word.

Closest sibling is Popover, through [Overlay](#overlay). **Shared:** `useOverlay` (open state,
controlled or not, the exit animation, Escape, focus return), the cloned trigger (no wrapper;
`_shared/useTriggerRef`, whose `trigger` may now be absent), the frosted surface and motion of
`Overlay.module.css`, and Title for the title. A modal's inside is shared with Drawer, its second consumer,
and lives in `_shared/ModalFrame` (below), so what follows is true of both except where Drawer says
otherwise. **What differs:** it is modal (`isModal`: a native `<dialog>` and `showModal()`, so the browser
makes the page inert and draws the backdrop, where a popover sits in the top layer over a live page), it
is centered in the viewport (no anchor, no `placement` or `align`), the trigger is optional (a
confirmation is opened from state, often after the Menu item that asked for it has gone), a press on the
backdrop closes it, and the page behind it doesn't scroll. `isModal` is the only new behavior in
`useOverlay`; the rest is its existing options turned on (Escape, focus return) or left off (outside
press: the backdrop is the dialog element itself, so Dialog reads that press itself).

**Behavior.** Pressing the trigger opens it (it can't toggle: the trigger is inert while it is open).
Focus goes where the browser puts it: the element with `autoFocus`, else the first focusable one inside
(the × when it is shown, since it comes first), else the dialog. A dialog with a form should put
`autoFocus` on the field, and one that asks to delete something on Cancel. The page is
inert, so Tab stays inside (and may reach the browser's own UI) and nothing behind it can be pressed
or read. Escape closes it, and so does a press on the backdrop that also started there (a text
selection dragged from the content onto the backdrop doesn't) unless `isBackdropClosing` is false, for a
form with unsaved input or a question that needs an answer; Escape, the × and the buttons still close it. A Select, Menu
or Popover inside it opens above it and takes the first Escape. When it is gone, focus goes back to the
trigger, or, with none, to what had it before it opened. While it is open the page doesn't scroll: `_shared/useScrollLock` sets `overflow: hidden` on `html`
and gives the scrollbar's width back as `padding-right`, so nothing shifts and no empty track is left
(`scrollbar-gutter: stable` keeps the space by drawing one, which can't be scrolled and which the
backdrop doesn't cover). It counts its users, so the page unlocks when the last dialog is gone.

**Accessibility.** `role="dialog"` with `aria-modal`, named by the visible `title` (an
`<h2>`, linked with `aria-labelledby`) or by `aria-label` / `aria-labelledby`, one of which the type
requires. The trigger gets `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` while open. A
confirmation should be described: `aria-describedby` goes on it as is. There is no `alertdialog` option: it
only changes what a screen reader announces, a dialog with `aria-describedby` gets most of that, and it
once changed `isBackdropClosing`'s default, which made two props that could disagree. If a case needs it,
add it as a pure role with no behavior tied to it.

**Close button.** A × at the top right, on by default: a dialog should have a visible way out, and
`isBackdropClosing={false}` with no Cancel would leave none. It is `_shared/CloseButton` (named "Close"),
the same round button as Banner's dismiss: a faint disc on hover, shrinks when pressed. Larger than
Banner's, through `IconButton`'s `--icon-button-size` and `--icon-button-icon-size` hooks: a 2.25em hit area around a
1.25em ×. It shares a row with the title (the title wraps before it, not under it); with no title it is
alone on the row, at the end. It sits in the content, so it scrolls away with a long dialog. Its hit area
reaches 0.75em up and right into the padding, so the × is the same distance (1.875em) from the top and the
right edges, a corner mark, not level with the title. It calls `overlay.close()`, the same
path as Escape, so a controlled caller can refuse and the exit animation runs. `isCloseButtonShown={false}`
removes it, for a question that needs an answer through the `actions` (Escape still closes it, and
`isBackdropClosing={false}` takes the backdrop away too).

**Look.** The page-colored background (`--color-dialog-background`, which aliases the modal recipe
`--color-modal-background`: the page color at 75%, more opaque than an ordinary overlay's 60% since it
holds more to read), 32em wide (at
most the viewport less 1em on each side), `--elevation-more`, 1.5em of padding in a column with a 1em
gap (title, children, actions). Past `min(40em, 100dvh - 2em)` the content scrolls, not the dialog. The
page is veiled by `--color-dialog-backdrop`, an alias of `--color-modal-backdrop`: the text color at 10%
in the light theme, a gentle dim, and
black at 50% in the dark theme (`themes.css` sets `--color-modal-backdrop`), where the text color would be white and lighten it. On a
dark page the dialog's edge is then subtle, and its shadow does the separating. The page behind it is also blurred (24px, `backdrop-filter` on the `::backdrop`; a fixed finish, not a token). Its corners are `--radius-more`, rounder than the other overlays (it sets `--overlay-radius`). It grows from its middle with the overlay's motion, and the backdrop and its blur fade with it.

**Shared with Drawer: `_shared/ModalFrame`.** Dialog is `ModalFrame` plus its size, its radius and its
two tokens. The frame owns `useOverlay` (`isModal`, Escape, focus return), `useScrollLock`, the cloned
trigger, the backdrop press, the name union (`ModalProps`, which `DialogProps` is), the header (title and
×), the children and the `actions`, and `ModalFrame.module.css`: the `<dialog>` element's finish
(`padding: 0`, `overflow: hidden`, the shadow, no focus ring, the 24px blur on the backdrop, and
`isBackdropShown={false}` to drop the veil and the blur) and the content box. The consumer passes `className` (the overlay classes from `Overlay.ts`, its size and
placement, and the `--modal-background` and `--modal-backdrop` hooks set from its own tokens) and
`contentClassName` (a `max-height`, and for Drawer a `min-height`, which the frame leaves to it). The
`actions` row has `margin-block-start: auto`: it is at the end of the content, and at the bottom of a
modal taller than its content, which is Drawer's case and changes nothing in a Dialog, whose height is its
content's.

**Not yet:** `size`, localisation of "Close", a close button that stays in view while the content scrolls,
a `Portal` (it is a DOM child of the trigger's parent;
the top layer ignores a `transform` ancestor, but `display: none` or `inert` on one still reaches it), a
dialog opened from inside another (the press on the backdrop of the one below, and the page's own
inertness), and returning focus to a trigger that has been removed (it falls to the body).

### Drawer

```tsx
type DrawerProps = DialogProps & {
  // title / aria-label / aria-labelledby, trigger, children, actions, aria-describedby,
  // isBackdropClosing, isCloseButtonShown, isOpen, defaultIsOpen, onOpenChange: as Dialog's
  placement?: 'start' | 'end' | 'top' | 'bottom'; // the edge it slides in from; default 'end'
  isBackdropShown?: boolean; // the veil and blur on the page behind; default true
};
```

A modal panel that floats beside an edge of the page: for a form, a filter list or a detail view that
deserves more room than a dialog, with the page still in sight beside it.

Closest sibling is Dialog, and the two are one component with two places on the screen. **Shared**
(`_shared/ModalFrame`, extracted from Dialog in the change that added Drawer, since Drawer is the second
consumer): every prop but `placement` and `isBackdropShown`, all the behavior (modal `<dialog>`, inert page, Escape, the backdrop
press, focus return, scroll lock, the trigger's ARIA), the header, the `actions`, the finish of the
element, the name rules, and `--color-modal-background` / `--color-modal-backdrop`
(`--color-drawer-background` and `--color-drawer-backdrop` alias them, as Dialog's do; Drawer's tokens are
there to be customised on their own). **What differs:** where it sits and how it moves, and its size.

**Placement.** `start` and `end` are logical, so in a right-to-left page they swap sides, and the slide
follows (`:dir(rtl)` in `Overlay.module.css`). `top` and `bottom` span the page. The `<dialog>`'s own
defaults (centred, `margin: auto`, a maximum size, `height: fit-content`) are undone and each placement
sets the insets of its edge. It uses `dockedClass(placement)` from `Overlay.ts` (see [Overlay](#overlay)),
which gives it the slide in place of Dialog's grow.

**Look.** It floats: `--drawer-gap` (1em, set in its CSS module, not a token) from the edge it is on and
from the two beside it, and every corner is `--radius-more`, as Dialog's are. A drawer flush with the edge
was the first version; a floating one reads as a surface over the page, not part of its frame. At the
sides it is 24em wide (at most the viewport less 3em, so a narrow screen keeps a strip of backdrop to
press) and the height of the page less the gap on each end; `top` and `bottom` are the width of the page
less the gaps and as high as their content, to `min(32em, 100dvh - 4em)`. The content is
laid out as Dialog's is: 1.5em of padding, a column with a 1em gap. It is at least as high as the drawer, so
the `actions` sit at the bottom however short the content is, and past the maximum height the content
scrolls, not the drawer. The slide starts the drawer's own size plus 2em out, so neither the gap nor the
shadow shows before it moves.

**Backdrop.** `isBackdropShown` (default true) is the veil (`--color-drawer-backdrop`) and the 24px blur on
the page behind. Set it to false to keep the page in view with the drawer over it: the `<dialog>`'s
`::backdrop` has no background and no filter (`.backdropHidden` in `ModalFrame.module.css`). The drawer is
still modal: the page is inert (it can't be pressed or tabbed to) and doesn't scroll, and a press where the
backdrop would be still closes it unless `isBackdropClosing` is false, so a drawer that should stay open
while the person looks at the page sets both. A page that stays usable beside it is a non-modal panel,
which this is not. The prop is `ModalFrame`'s and not in `ModalProps`: Dialog doesn't expose it, since a
dialog with no veil has little to set it apart from the page, but it could with no change to the frame.

**Not yet:** `size` and a width (24em is fixed; `className` isn't a prop), a non-modal drawer (the page
beside it live), a header and an actions row that stay in view while the content scrolls (Dialog has the
same limit), and resizing.

### Toast

Researched against Base UI's Toast, Sonner, Radix, and WCAG 2.2.1 (Timing Adjustable). `Toast/` has
`ToastProvider` (the list, the queue, the viewport, `useToast`), `Toast` (`ToastView`, one toast),
`ToastAnnouncer` and `useToastTimers`.

```tsx
<ToastProvider placement="bottom" align="end" limit={3} duration={5000}>
  <App />
</ToastProvider>;

const toast = useToast(); // { add, update, close }
const id = toast.add({
  id, // optional: an id that exists updates that toast in place and restarts its timer
  title, // a short headline, in heavier type
  description, // the message (ReactNode); one of title / description is required
  action, // ReactNode: a Button or a link. A toast with one stays until dismissed (see Timer)
  size, // ScaleProp: the font size, which the padding and gaps follow; default 'normal'
  duration, // ms; default the provider's 5000; 0 = until dismissed
  priority, // 'low' (polite, default) | 'high' (assertive)
  onClose, // called once it is gone, whoever closed it
}); // returns the id
toast.update(id, { description: 'Saved' });
toast.close(id);
```

A message that appears over the page for a moment, fired from an event handler or async code, not
rendered where it concerns. Closest sibling is Popover, through [Overlay](#overlay): a small floating
surface of text and a Button. (It was a Banner first, a flat block of the brand color with a shadow added;
it floats, so it is drawn as the other floating things are, not as a block that has been lifted.) **Shared:**
the overlay's finish and motion (`_shared/Overlay.module.css`, through `floatingClass` in `Overlay.ts`: the
frosted glass, the squircle corners, the grow-out and shrink-back, the border under `forced-colors`), its
surface color (`--color-toast-background` aliases `--color-overlay-background`, as Popover's), the shadow
(`--elevation-more`), `_shared/CloseButton` for the ×, the `size` scale (`_shared/Size.module.css`: it is
the only scale prop), and the vocabulary `OverlayPlacement` / `OverlayAlign` from `_shared/Overlay.ts`.
**What differs:** it is fired, not rendered (a provider and a hook), it is one of a stack, it times out, it
is placed by its viewport at a corner of the page and not against an anchor, and it has a title, an action
and a ×. There is no `background` prop: no other overlay has one, and the surface is the overlay's. The
provider and the hook are the first React context in the library besides the theme. They are the only
shape that gives stacking: a declarative `<Toast isOpen>` leaves the queue and the limit to every caller.

**One provider per page.** Each `ToastProvider` has its own list and its own viewport, fixed to its corner,
so two on one page put their toasts on top of one another and don't share a limit. Put one near the root.
Storybook's Docs page renders every story at once, each with its own provider, so the Toast stories are
rendered in iframes there (`docs.story.inline: false`); in a story's own page there is only one.

**Stack.** One viewport holds every toast, in a column at `placement` (`top` / `bottom`) and `align`
(`start` / `center` / `end`; logical, so `start` and `end` swap in a right-to-left page); default bottom, end.
The newest is nearest the edge. At most `limit` (3) show; the rest wait, unmounted, and the next one takes
its place when one goes (so a burst is not read out in one go). A waiting toast can still be updated or
closed by its id (a queued toast that is closed is dropped at once, with no exit). One that leaves stays
mounted for its exit animation (`_shared/usePresence`, 300ms for a toast) and **holds its place until it
is gone**: a queued toast takes over that place when the exit is over, not beside the leaving one. Showing
it at once made the three on screen jump up a whole toast in one frame, as the old one began to fade, and
back down when it was removed. This way the stack is never more than `limit` high, and a toast dismissed
at the edge is replaced in the same place, with nothing moving. When the others do have to move (a toast
added at the edge, one removed from the middle or the near end, a queued one arriving as the oldest leaves),
they glide there in 250ms instead of jumping: `useReflow`, below. There is no collapsed "deck" of
overlapping toasts (Sonner's); it is a second layout for the same content. Adding a toast whose `id` is there, even one that is leaving, updates it and brings it back.

**Timer.** `duration` of 5000 ms from the moment it shows (not from when it was queued). It pauses while the pointer
is over the viewport, while focus is inside it, and while the tab is hidden, and resumes with the time
that was left. A toast with an `action` defaults to `duration: 0` (until dismissed): a message the person may
need to act on must not vanish under the pointer. A caller can still pass a number. **The rule for callers:**
a finite toast confirms something the page also shows (WCAG 2.2.1 allows a timed message the person can find
another way). Anything they must read, and can't find elsewhere, is a Banner or `duration: 0`.
Escape is not used: it belongs to the overlay below.

**Announcing.** Each toast is announced once, by a persistent, visually hidden live region (polite for
`low`, assertive for `high`) that the provider keeps mounted, and not by a `role="status"` on the toast
itself: a live region that is inserted with its text is announced unreliably, and with the announcer it
would say it twice. The toast has a non-live role (`group`). The visible
viewport is `role="region"` named "Notifications", only while it holds a toast (an empty landmark is
noise). The text is the title and the message's text content, said once per revision (an `update` says it
again; a toast that waited in the queue says it when it shows) and cleared after 3 s so a screen reader's
browse mode doesn't find it left behind. The same text twice is still read: the text node is replaced
(`key`). The regions are `_shared/VisuallyHidden`, built with Toast (the foundations list's utility; not
exported).

**Inside a modal.** A modal `<dialog>` makes everything outside it inert (it can't be pressed, focused or
read), and the top layer ignores `z-index`, so a toast beside it would show behind nothing and could not be
used. `_shared/ModalFrame` registers its `<dialog>` as a toast host while it is open (a small context in
`_shared/`, a no-op without a provider), and the provider portals the viewport and the announcer into the
topmost host, else to its own place. The timers and the queue are the provider's state, not the DOM's, so
the move does not reset them; the toasts remount (the enter motion plays again, focus inside a toast is
lost) and the viewport shows itself again on mount. The viewport is then the last child of the dialog, so Tab
reaches it after the content. It unregisters when the modal starts to close, not when it unmounts, so it
is back on the page before the `<dialog>` is removed. Dialog and Drawer both get this through `ModalFrame`.

**Look.** The overlay's frosted page-colored surface (`--color-toast-background`, the page color at 60%,
with the page blurred behind it) with `--elevation-more`, and the overlay's `--radius-normal` corners. A
toast has two elements: the surface (`.toast`, with the overlay classes, the background and the shadow) and
inside it the content (`.content`), which has the padding, the layout and the font size. `size` is on the
content and not on the surface because the overlay's `font: inherit` is on the surface, and a `font-size`
beside it would be settled by file order. So the width is the content's: 24em, at most the viewport less
2em, and a larger `size` makes a wider toast, as it makes a taller one. The content is a row: the text on
the left (the title in `--weight-more`, the message under it, the `action` under that, `0.5em` apart) and
the × at the top right, as Banner's, centered on the first line. The viewport is 1em from the edges and the
gap between toasts is 0.5em. It comes in as the overlay does: it grows out of the edge it sits against
(`data-side` is `top` for a toast above the bottom edge, so it grows from its bottom and starts a little
lower; `bottom` for the top edge), with the springy `--ease-enter` and a fade; it leaves
more slowly than an overlay does: the overlay's 150ms exit has an ease that is done in about 90ms of it,
right for a popup that was asked for, and a cut for a toast that goes by itself with the page in view. So
a toast's exit is the same two animations at 250ms (`animation-duration` and `animation-timing-function`
in `Toast.module.css`, under `.viewport .toast` so the file order doesn't matter), the fade easing at
both ends, and `usePresence` keeps it for 300ms; with `prefers-reduced-motion` only the fade, in 150ms. The ×'s look is `_shared/CloseButton`'s.
The one new token is `--color-toast-background`, so a theme can recolor it on its own.

**Shared code extracted in the same change.** `useOverlay` kept the 200 ms an overlay stays mounted to
animate out; every toast needs the same, so it is `_shared/usePresence(isOpen)` and `useOverlay` calls it.
`Overlay.ts` gained `floatingClass` for an overlay that is neither anchored nor modal. The viewport is
not a `useOverlay` consumer: its life is the toasts' presence, there is no trigger or anchor, and it must
show itself on mount to survive being moved into a modal. It sets `popover="manual"` and calls
`showPopover()` itself (in `ToastProvider.tsx`; a popover's own `display: none` is only overridden once
`:popover-open`). The timers are `useToastTimers`, which keeps each toast's time left in a map, outside
the toasts, so a remount doesn't start it again. `usePresence(isOpen, exitMs)` takes the time the exit
takes (default 200ms, the overlay's). `useReflow` is the glide: each render it reads where each child
of the viewport was and is, and animates the difference away with `translate` (a property of its own, so
it doesn't fight the `transform` of the enter and leave animations), over 250ms with `--ease-leave` read
from the token; not under `prefers-reduced-motion` or without the Web Animations API. It reads nothing while
the viewport is `display: none`, which it is until `showPopover()` has run (an effect, after the hook's
layout effect): everything in a hidden element reads as 0, so the first toast, measured then and again at the
next render, was "moved" 500px from the top of the page to its place. A regression test emulates that.

**Checked in Chrome** (by a script driving the Storybook stories, not kept in the repo): a toast fired
in an open Dialog is inside the `<dialog>`, is the element under the pointer, and its action and × can be
pressed; the same toast moved out of the dialog by hand is under the `<dialog>` and can't be pressed (so
the relocation is what makes it work); on the page it sits at the bottom end, a pointer over it holds the
timer past 5 s, five fired shows three, and the queued ones take their turn; a toast that is dismissed
is half faded at about 125ms (it was 48ms with the overlay's exit, and gone by 100ms) and under 5% at
about 210ms, never more than `limit` are on screen, and the largest move of any toast between two frames is
4px (a glide) or under 1px (when the queued one takes the dismissed one's place); it was 54px, in one frame; the viewport is back on the
page, and usable, when the dialog closes. The look was checked over a striped page: the frosted glass
blurs and tints what is behind it and the text stays readable, an action sits under the message, and
`size` scales the padding and gaps with the text. Tests (jsdom) cover the rest: timers and pausing, the
queue, update and revive, announcing, the surface's classes and the grow direction, and the move into and
out of a modal.

**Not checked:** with a screen reader (that the announcer speaks, and is not silent for the first message
of a toast fired in the same render as a modal opening, when its live region has just moved), in Firefox
or Safari, or that focus behaves in a toast pressed with the keyboard.

**Not yet:** swipe to dismiss, promise toasts (`loading` / `success` / `error` in one call), dedupe of an
identical message, the collapsed deck, an F6-style hotkey into the
viewport, focus going somewhere sensible when a toast that had it is dismissed (it falls to the body), a
global manager for use outside React (`createToastManager`), localisation of "Notifications", per-toast
`placement`, and `closeAll`.

### Tabs

```tsx
type TabItem = Omit<OptionBase, 'description'> & {
  icon?: ReactNode; // value, label, isDisabled? and:
  content: ReactNode; // the panel while this tab is selected
};

type TabsProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'color' | 'children' | 'role'
> & {
  items: TabItem[];
  value: string; // always controlled: the parent owns the selection
  onChange: (value: string) => void; // not called for the tab that is already selected
  orientation?: 'horizontal' | 'vertical'; // default 'horizontal'
  isSticky?: boolean; // keeps the tabs in view while the panel scrolls under them; default false
  size?: ScaleProp; // font-size; default 'normal'
  'aria-label'?: string; // name the tablist; optional, each tab has its label
  'aria-labelledby'?: string;
};
```

One panel at a time, chosen from a row (or column) of tabs. Tabs are data (`items`, as Radio's `options`
and Menu's `items`), not children, so the roles and the keyboard model can't be broken by custom content;
the panel's content rides along as each item's `content`.

Closest sibling is Radio (one of several, a roving arrow-key model, `orientation`, `value` /
`onChange`), and Menu for the focus. **Shared:** `OptionBase` (minus `description`, which a tab has no
room for), `OptionIcon`, `stepEnabled` from `_shared/optionNavigation`, and `size` from
`_shared/Size.module.css` (the only scale prop, as Progress's). **Not shared: uncontrolled state.** Radio
and Checkbox are inputs, so a lone `<Radio options>` that keeps its own choice makes sense. Tabs is not an
input: what the screen shows follows the selected tab, and it may belong in the URL, so the state lives in
the parent and `value` and `onChange` are required (a `defaultValue` would only save a `useState`).
**What differs:** a Radio's value is data for a form, so its inputs are native and the browser roves
them; a tab has no native element, so the roving is ours (as Menu's): the focused tab is found from its
element, with no state for it, and the tab stop is the selected one. And a selection has a panel, which
only the selected tab mounts.

**Behavior** (WAI-ARIA APG tabs, automatic activation). ← → (↑ ↓ when vertical) move focus _and_ select,
and wrap at the ends (as a native radio group does; Menu and Select stop). Home and End go to the first
and last enabled tab. Disabled tabs are native `disabled` buttons, so they are skipped. Left and right swap
in a right-to-left list. Tab leaves the row for the panel (`tabIndex={0}`, so a panel with nothing focusable
is still readable by keyboard). A `value` that names no tab falls back to the
first enabled one. Only the selected panel is mounted, and it remounts on each change, so one panel's state
isn't carried into the next.

**Accessibility.** `role="tablist"` with `aria-orientation`; each tab a `role="tab"` button with
`aria-selected` and, on the selected one only, `aria-controls` (the others have no panel to point at); the
panel `role="tabpanel"` named by its tab. The icon is decorative.

**Look.** A floating tray with the **overlay look**: it takes `floatingClass` from `_shared/Overlay` (the
frosted blur, the squircle at `--radius-normal`, no border), `--color-tabs-background` aliases
`--color-overlay-background`, and the shadow is `--elevation-more`, as Popover and Menu have. It has no
`data-state`, so none of the overlay's open / close motion applies. It is deliberately not the field fill,
which is brand-tinted: tabs often sit right above a form, and a tray in the field color would read as one
more field. Behind the selected tab sits **one thumb**, a raised block in the page color
(`--color-tabs-thumb`, an opaque `Canvas`, so it stands out of the translucent tray; `--elevation-normal`) with a
radius of the tray's less its padding, so the curves are concentric. `_shared/SlidingThumb` (also SegmentedControl's) measures the selected tab
(`offsetLeft` / `offsetTop` / size, in a layout effect, and again from a `ResizeObserver` on the tab and its
list) and sets the thumb's size and `translate`; it is one element that moves, so it slides, with the
overlay's springy `--ease-pop` curve. It is placed from the physical top-left, which is what the offsets
are, so it holds in a right-to-left list. It mounts already in place (no slide in from the corner) and is
not rendered while nothing is selected. A tab stacks its icon (1.5em) over its label; unselected tabs are
`--color-text-less`, the selected one `CanvasText` with its icon in `--color-tabs-accent`, which aliases
`--color-primary-strong` (the plain primary is 2.1:1 on white). Hover changes the text color and has the system's motion, as
SegmentedControl's: a tab springs to 1.06 on `--ease-enter` (500 ms, overshoots and settles) and returns on
`--ease-leave`; pressed, it shrinks to 0.95 in 120 ms with no overshoot. The thumb does the same when the selected
tab is the one under the pointer or pressed (the same scale from the same middle, so the tab stays inside it),
through `--thumb-scale` on `_shared/SlidingThumb`. With `prefers-reduced-motion` nothing scales. In
`forced-colors`, where a background can't show the thumb, the selected tab gets a `Highlight` outline. Not yet checked by eye: the tray and the thumb are both the page color (the tray at 60%, over a blur), so on a plain page the thumb is told from the tray by its shadow and the blur's tint, not by a fill. If that reads weakly, give `--color-tabs-thumb` a stronger value (a light brand tint, and a dark one in `themes.css`).

**Sticky.** `isSticky` puts `position: sticky` on the list (`z-index: 1`, `top: var(--tabs-sticky-top, 0.25rem)`).
The list is a child of the root, so it sticks _inside_ it: it holds while the panel scrolls under the frosted
tray and lets go once the panel has scrolled past, with no wrapper. It sticks to the nearest scrolling
ancestor, so an `overflow: hidden` or `auto` box in between stops it (a platform rule, not ours). Works in
both orientations. The gap to the edge is a CSS variable on the Tabs, not a token, since it is a length. The
fixed-to-the-viewport bar of a mobile app (`position: fixed`, at the bottom) is a different thing, not done.

**Not yet:** a list wider than its box (scrolling, or an overflow menu), manual activation (arrows move
focus, Enter or Space selects), keeping inactive panels mounted, a `Tabs.Tab` compound form for content that
can't be data, a badge / `Indicator` on a tab, a closable or reorderable tab, `description`, a variant without the
tray, and a `fullWidth` list that spreads the tabs across it.

### Collapsible

```tsx
type CollapsibleProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'color' | 'children' | 'defaultValue'
> & {
  title: ReactNode; // the header's text; the whole header is the button
  icon?: ReactNode; // before the title; decorative
  children: ReactNode; // what folds away
  isOpen?: boolean; // controlled; pair with onOpenChange
  defaultIsOpen?: boolean; // starts open, when uncontrolled; default false
  onOpenChange?: (isOpen: boolean) => void;
  isDisabled?: boolean; // default false
  size?: ScaleProp; // font-size; default 'normal'
};
```

One piece of content that a header folds away: the details of a row, an "Advanced" section of a form, an
answer under its question. Not for choosing between panels (Tabs), and not for several that open one at a
time (Accordion, not built yet, on top of this).

Closest sibling is Popover on the _state_ side: `isOpen` / `defaultIsOpen` / `onOpenChange`, uncontrolled
unless `isOpen` is given, and a controlled one wins over `defaultIsOpen`. It is not Tabs' required-and-controlled:
a tab's selection decides what the screen shows (and may belong in the URL), but a Collapsible's open state
is usually local to the widget (an FAQ answer, an "Advanced" section), and the major libraries and the
native `<details>` all let it keep its own. Controlled is there for when the parent needs it (an "expand
all", the URL). **Shared:** `size` from `_shared/Size.module.css` (the only scale prop), `OptionIcon`,
`isDisabled`, and the chevron of Select's field, whose second consumer this is: `_shared/ChevronIcon` was
extracted in the same change, with the shell it has in common with CheckIcon and CrossIcon
(`_shared/StrokeIcon`). **What differs:** the height animation, and the content that stays mounted.

**Behavior** (WAI-ARIA APG disclosure). The header is a `<button type="button">` with `aria-expanded` and
`aria-controls` (the content's id, `<id>-panel`); Enter and Space press it as they do any button, so there
is no key handling of our own. It toggles its own state unless `isOpen` is given, and calls `onOpenChange(!isOpen)` either way (a controlled one changes nothing itself). **The content
stays mounted while closed**, so what is inside it (a half-filled form, a scroll position, a loaded image)
is kept; it is `visibility: hidden`, which takes it out of the tab order and the accessibility tree. It is
not `display: none` or unmounted, because the height has to animate. A disabled Collapsible is a native
`disabled` button, and stays as open or closed as it was.

**Accessibility.** The title is the button's name and the icon is decorative. The content has no `role`
(APG: a `region` per panel is noise when there are many of them). No heading level is rendered: wrap the
Collapsible's `title` in a heading yourself if the page outline needs one.

**Look.** No surface of its own (wrap it in a Card for one). The affordance is the point of it. A bare
line of text with a chevron left a collapsed section hard to tell from an empty one, so **the
header is filled while collapsed** (`--color-collapsible-background`, an alias of `--color-field-background`;
a fill says "pressable", as Chip's), a step stronger under the pointer
(`--color-collapsible-background-hover`), and **has no fill while open**, so the open content is not framed
by a bar; under the pointer an open header takes the collapsed fill back, as a hint that it presses. The
row is a full-width `--radius-less` squircle, the title taking the room, and the chevron at the end. It is
Select's glyph (`_shared/ChevronIcon`) but not its behavior: Select's flips down / up, which says "dropdown";
this one **points right when collapsed** (left in a right-to-left layout, through `:dir(rtl)`), toward what is
not shown, and turns a quarter turn to point down when open. It turns with Select's motion (an overshoot
opening, none closing) and grows on hover by `--scale-icon-hover`. The state is carried by the fill, the
chevron and the content together, not by the chevron alone. (Tried and dropped: the chevron at the start
with the content indented under the title; it looked odd beside the padded content.)
The content lines up with the header's text. It opens by animating its grid
row from `0fr` to `1fr` (300 ms closing, 400 ms opening, `--ease-leave`), which needs no measuring and
follows content that changes size while it is open. The content has inline padding only: block padding
could not shrink with the row and would leave a sliver when closed. `prefers-reduced-motion` turns the
motion off.

**Not yet:** unmounting the closed content (a `keepMounted={false}`, for heavy content), `hidden="until-found"`
so find-in-page opens it, a heading level, a trailing slot in the header (a count, an
`Indicator`), an Accordion over several. Not yet checked by eye: the height animation and the hover fill
were written from the CSS, not seen in Storybook.

---

### Link

```tsx
type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> & {
  size?: ScaleProp; // font-size; unset, it is the size of the surrounding text
  isCurrent?: boolean; // aria-current="page", and the surrounding text color
  isDisabled?: boolean; // no href, dimmed, role="link" aria-disabled; does nothing
};

type LinkProviderProps = {
  navigate: (href: string) => void; // the router's: useNavigate(), router.push
  resolveHref?: (href: string) => string; // what the anchor carries: a base path, or '#' + href
  children: ReactNode;
};
```

A real `<a href>` with no `text-decoration`. Its underline is the `::after`: a faint rule (0.12em, the
field fill) along the bottom of the text that grows up to cover it on hover, drawn behind the text. It
has the ring of Chip and Button on `:focus-visible`. The rule and the highlight are one color,
`--color-link-underline`, an alias of the field fill: the highlight is the rule, grown.

**Wrapping.** The `::after` is positioned against the link, and a link that wraps onto a second line is
two boxes to the browser: the rule and the highlight then span from the first box's corner to the last
box's, not each line. Fine for a link that is a word or a phrase on one line (breadcrumbs, nav, buttons
in text), wrong for a long link in a paragraph. The fix, if needed, is a `background` gradient with
`box-decoration-break: clone` in place of the `::after`. **Contrast.** The 15% rule is faint on purpose,
so it is not a 3:1 cue on its own; the link color is the other cue.

**Routers.** Researched against React Aria (`RouterProvider`), Radix and Chakra v3 (`asChild`), MUI and
Mantine (`component`), Base UI (`render`) and TanStack Router (`createLink`). A plain `<a>` works with
any router but loads the whole page, so a link needs a way to reach the router. The three prop-based
ways (`component`, `asChild`, `render`) make every call site write `<Link asChild><RouterLink to=…/>`,
and our components take data (`items`), where there is no call site to write it at. So it is React Aria's:
**one `LinkProvider`** inside the router, which takes `navigate` (a function, so it fits any router),
and every link below it uses it. The provider needs no clone, so no React 18 / 19 `ref` branch.

- A plain left click on a link to a place in the app calls `navigate(href)` and `preventDefault`s. The
  browser keeps every other click: Ctrl / Cmd / Shift / Alt, a button other than the left, `target` other
  than `_self`, `download`, another origin (`https:`, `mailto:`, `tel:`), a fragment (`#section`), and a
  click the caller's own `onClick` already handled (`preventDefault`).
- **`resolveHref`** (optional) turns the `href` a link is written with, in the router's terms (`/about`),
  into the real URL for the anchor's `href` attribute. It is needed only when the two differ: the app is
  under a base path (`basename: '/app'`: `/about` → `/app/about`), or uses a hash router (`/about` →
  `#/about`). A normal click goes to `navigate` and never reads the attribute, so the router alone would
  work; everything else reads it: Ctrl / Cmd-click and "open in new tab" (`/about` would be a 404 under
  `/app`), "copy link address", the status bar, a crawler, and the page before React has run. `navigate`
  always gets the `href` as written, so the router still gets its own terms. Leave it out for an app
  served from `/` with a browser router, which is most. It is a plain function, not a hook as React
  Aria's `useHref` is, so it can't call a router hook: pass the base path yourself.
- Without a provider a link is a plain anchor, so the library has no router dependency.
- The logic is `_shared/useLinkProps` (the context, `LinkRouter`, and the hook that returns `href` and
  `onClick`), so Link is its first consumer, not its only: Breadcrumb's items are Links, and a Menu item
  that is a link, and Pagination's pages in link mode, call the same hook; a Card with an `href` would too.

**Not through the router:** prefetching on hover or in view (Next's `<Link>`, TanStack's `preload`),
typed routes, and an active-link state that the router works out. A string `href` can't give typed
routes, and `isCurrent` is passed by the caller. The way out, when it is asked for, is a `render` prop on
Link; it would sit beside the provider and break nothing.

**Size.** `size` is its only scale prop, so it passes `_shared/Size.module.css`, and has no default: a
link in a sentence is the sentence's size (as Spinner is 1em). `--color-link` aliases
`--color-primary-strong`, the neutral shared token Indicator's mark and Text's `more` use.

**Not yet:** `isExternal` (a `target="_blank"` with `rel`, and a mark that says so), `Button` rendering
as a link (`href`), a visited color, Link on a `more` Banner or Button, where the brand color is the
background and the link would vanish. Not yet checked by eye: the underline, the hover and the ring were
written from the CSS, not seen in Storybook.

---

### Breadcrumb

```tsx
type BreadcrumbItem = {
  label: string;
  href?: string; // as Link's; none: plain text (the current page, or a level that is not a page)
};

type BreadcrumbProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'children'> & {
  items: BreadcrumbItem[]; // top level first; the last item is the current page
  size?: ScaleProp; // font-size; default 'normal'
  'aria-label'?: string; // default 'Breadcrumb'; aria-labelledby replaces it
};
```

Where the reader is in a site and the way back up. Not for the sections of one page (Tabs) or the steps of
a flow (a Stepper, not built).

Closest sibling is Link, which draws each item and routes it: under a `LinkProvider` a click on a level
goes to the router with no page load, and nothing in Breadcrumb knows about routers. **Shared:** `items`
as data, as Tabs and Menu take theirs; `size` from `_shared/Size.module.css` (the only scale prop),
default `normal` as Tabs'; the separator is `_shared/ChevronIcon` turned a quarter, with Collapsible's
`:dir(rtl)` flip. **New:** the `<nav>` + `<ol>`, which item is current, and the row. It adds no token:
the color, the highlight and the ring are Link's, and the separator is `--color-text-less` as the option
descriptions.

- **APG breadcrumb:** a `<nav>` landmark named `Breadcrumb` (an `aria-label` for another language or a
  second trail), holding an ordered list, since the order is the meaning. The separators are decorative
  (`aria-hidden`) and not list items, so a screen reader hears "list, 3 items" and each name. The `<ol>`
  carries `role="list"`: Safari and VoiceOver stop announcing a list whose bullets are removed.
- **The last item is the current page.** It gets `aria-current="page"`, a heavier weight and no link
  color. With no `href` it is a `<span>`; with one it is a Link with `isCurrent`, which is still a link
  (to reload, or copy the address). No `isCurrent` prop on the item: where the reader is, is the end of
  the trail. A level before the end with no `href` is plain text and not marked.
- **Long trails wrap** onto more lines (`flex-wrap`). Not done: collapsing the middle into a "…" that
  opens a Menu, which the big libraries all have. It needs a measuring pass (as Tabs' thumb) or a
  `maxItems`; add it when a trail is long in real use.
- An empty `items` renders nothing, and a landmark with no list would be noise.

**Not yet:** an `icon` on an item (a home glyph for the first), a custom separator (`/`, a dot), the
collapsed middle, and the schema.org `BreadcrumbList` markup for search engines (a JSON-LD concern, not
the component's). Not yet checked by eye: the row, the chevron's turn and the wrapping were written from
the CSS, not seen in Storybook.

### Pagination

```tsx
type PaginationLabels = {
  previous?: string; // default 'Previous page'
  next?: string; // default 'Next page'
  page?: (page: number) => string; // default (n) => `Page ${n}`
};

type PaginationProps = Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'color' | 'children'> & {
  page: number; // current, from 1; always controlled. Out of range: the nearest page that exists
  pageCount: number; // how many pages (not items); 1 or fewer renders nothing
  siblingCount?: number; // pages each side of the current one; default 1
  boundaryCount?: number; // pages always shown at each end; default 1
  isDisabled?: boolean; // default false
  size?: ScaleProp; // font-size; default 'normal'
  labels?: PaginationLabels; // another language; a label left out is the English default
  'aria-label'?: string; // default 'Pagination'; aria-labelledby replaces it
} & (
    | { onChange: (page: number) => void; getHref?: (page: number) => string } // buttons
    | { getHref: (page: number) => string; onChange?: (page: number) => void } // links
  );
```

Moving between the pages of a long list or table. Not for the sections of one page (Tabs) or where the
reader is in a site (Breadcrumb).

Closest sibling is Tabs on the _state_ (the current page decides what the screen shows and belongs in the
URL, so `page` is required and controlled, with no `defaultPage`), and Breadcrumb on the _shell_ (a `<nav>`
holding an `<ol>`, `aria-label` with a default, `size` from `_shared/Size.module.css`, `ChevronIcon` turned
a quarter and flipped under `:dir(rtl)`). **Shared:** those, `useLinkProps` for link mode (its second direct caller, after Link), and the look of Chip's selectable pair (nothing behind
it, the field's hover fill, the brand color for the current one, the press that shrinks). **New:** the
window of pages (`pageSlots.ts`), and a control that is a button or a link. It adds three tokens, all
aliases: `--color-pagination-background-hover` (the field's stronger tint), and
`--color-pagination-background-current` with `--color-pagination-text-current` (the brand color and its
text, as Chip's selected pair; `themes.css` overrides both, and a test fails if only one is overridden).

- **`pageCount`, not `total` + `pageSize`.** Pagination draws page numbers; `Math.ceil(total / pageSize)` is
  the caller's, and a page-size selector is a different component.
- **Buttons or links.** With only `onChange` the pages are `<button>`s. With `getHref` they are real
  `<a href>`s through `useLinkProps`, so "open in new tab", "copy link address" and crawlers work (which
  matter more for pagination than for most things), and under a `LinkProvider` a click goes to the router
  with no page load. The prop type needs at least one of the two. With both, `onChange` is called on a
  plain click before the link is followed (analytics, scroll to top). Link mode does not use the `Link`
  component, whose underline look is wrong for a page button; it takes only its hook.
- **The row is the same width on every page.** Longer than `2 * boundaryCount + 2 * siblingCount + 3`, it
  is exactly that many places, so nothing moves under the pointer as you page. To keep it so, a gap that
  would hide one page shows that page instead; a gap stands for two or more. Fewer pages than places: all
  are shown, with no gap. (MUI's Pagination is the model; its algorithm is `pageSlots.ts`.)
- **The gap "…" is decoration:** `aria-hidden`, not a button, no jump-ahead. Any page is a press of
  previous or next away from one in view. A screen reader hears "list, N items" and each name.
- **Previous and next stop at the ends, not hide**, so the row doesn't shift. They are `aria-disabled`
  and not `disabled`, so pressing Next onto the last page doesn't drop the focus on the body (a disabled
  button can't keep it). In link mode an end has no `href` and `tabindex="0"`, for the same reason.
  `isDisabled` is different: nothing can be pressed, so the buttons are natively `disabled` and a link has
  no `href` and no tab stop, as Link's `isDisabled`.
- **The current page is `aria-current="page"`** and still a control: a button that does nothing when
  pressed, or a link to itself (reload, copy the address). `onChange` is not called for it, as Tabs'.
  Each page's accessible name is `labels.page(n)` ("Page 3"), since it shows only its number; previous
  and next show only a chevron and are named by `labels`.
- **Labels are one object**, not three flat props, so the prop list stays short; the other components
  take only `aria-label`, which this still has for the landmark.
- **Look** (now `_shared/RoundControl.module.css`, shared with Calendar's cells). A control 2.25em high (and at least as wide, so "1000" grows it) with a radius of half that, so
  a single digit is a circle and "100" a pill: round arcs as a chip's ends, not the squircle of Button and
  Card. Flat, no shadow. In `forced-colors` the current page gets a `Highlight` outline, since its
  background is dropped. The row wraps on a narrow screen. Digits are tabular.
- **Motion** is the system's, not a fade. Hover scales a control to 1.1 on `--ease-enter` (Button's
  overshoot, entering; the plain `--ease-leave` leaving) and fills it with the field's hover tint (not the
  current page, which has its own); `:active` settles it to 0.95 without overshoot. The chevron swells to
  `--scale-icon-hover` as Chip's × does. The current page's fill is a layer (`::before`) behind the
  label that grows from the middle on `--ease-pop`, and shrinks away on the page that stops being
  current, so the brand color seems to move along the row (the thumb of Tabs and Toggle, as a pop and not
  a slide: the pages come and go as the window moves, so there is no one element to slide). Hover is
  off for a touch pointer, and under `prefers-reduced-motion` nothing scales: the tints are the cues.

**Not yet:** a compact "3 / 12" form for a narrow screen, a "go to" input, a page-size selector, First and
Last buttons (the boundary pages do that), a gap that opens a menu of the pages it hides, and a count of
the items ("21–40 of 312"). Not yet checked by eye: the controls, the current page's fill, the turned
chevrons and the focus ring were written from the CSS, not seen in Storybook.

### FileUpload

```tsx
type FileUploadProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'size'
  | 'color'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'accept'
  | 'multiple'
  | 'children'
> &
  NameProps & {
    size?: ScaleProp; // font-size on the root, as TextField
    label?: string;
    error?: string; // the caller decides when; the component never writes a message
    isDisabled?: boolean;
    isRequired?: boolean; // native `required` (form mode) + the asterisk
    accept?: string; // native syntax (".pdf, image/*"); also checked in code, since a drop ignores it
    multiple?: boolean; // without it a new file replaces the old one
    maxSize?: number; // bytes, per file
    maxFiles?: number;
    value?: File[]; // controlled
    defaultValue?: File[]; // uncontrolled; never uploaded (they are already there)
    onChange?: (files: File[]) => void; // after every add or remove, with the whole list
    onReject?: (rejections: { file: File; reason: 'type' | 'size' | 'count' }[]) => void;
  } & (
    | { uploadFile?: undefined; onUploaded?: never } // form mode
    | {
        uploadFile: (
          file: File,
          control: { signal: AbortSignal; onProgress: (fraction: number) => void },
        ) => Promise<unknown>;
        onUploaded?: (file: File, result: unknown) => void; // the promise's value (a pre-signed key, ...)
      }
  );
```

Two uses, told apart by one prop, the way `type` unlocks `isRevealable` in TextField:

- **Form mode** (no `uploadFile`): the files stay in the native `<input type="file">` and go with the
  form (`name`). Nothing is sent by the component.
- **Upload mode** (`uploadFile`): each file the user picks is handed to `uploadFile` at once, for a
  pre-signed URL and a PUT, say, and the result is attached to the consumer's own data. The component still
  does no network: `uploadFile` is the consumer's. It is named for what it does to one file; `upload`
  would repeat the component's name and read as a mode flag, and `onUpload` would say it is an event
  whose result is ignored, which this one's is not.

**Control.** The native input is stretched over the drop zone at `opacity: 0`, so click, keyboard,
dropping a file on it, `accept`, `multiple`, `required` and form submission are the browser's. The label
points at it. The zone is `_shared/TextFieldFrame`'s `.control` class on a `<div>` (as Select's box of
chips: the box holds the focused element rather than being it), so the fill, hover, focus border and
error fill are the field's; the frame gives the root, `size`, label, error message, id /
`aria-invalid` / `aria-describedby` wiring and the disabled dimming. A disabled zone takes no pointer
(as Select's box). Content is an `OptionText` with an upload icon (`FileUpload/FileIcons.tsx`, on
`StrokeIcon`'s shell): "Drop files here or browse" (or "a file" when not `multiple`) and a hint built
from the limits, "Accepts .pdf, image/\* · Up to 5 MB each · Up to 3 files". Labels are English and fixed,
like Select's "Clear". Dragging a file over the zone (counted `dragenter` / `dragleave`, only for drags
whose `types` include `Files`, since the enters outnumber the leaves while the pointer is over what is
inside the zone) gives it the hover fill and the 2px brand inset border of the focus state: no new
recipe, and a drag does not update `:hover`, so the fill is set on `data-dragging`. The zone is
pressable, so it has the option row's motion: grow to 1.02 on hover (overshooting on `--ease-enter`), shrink to
0.98 when pressed, a drag over it as a hover; `prefers-reduced-motion` keeps the colors and drops the scale.

**Value.** `value` / `defaultValue` / `onChange`, on `_shared/useControlledState` (extracted from
`useChoice`, which now sits on it). In form mode `input.files` is rebuilt through `DataTransfer` whenever
the list changes (`syncInputFiles`), so submission and `required` match the list; where there is no
`DataTransfer` (jsdom, an old browser) the call is a no-op in a try / catch and the list is still right.
In upload mode the input is emptied after each pick, since the list now holds the files (and the same
file can be picked again), so `name` submits nothing, and `isRequired` is `aria-required` only, because
an always-empty input would never validate.

**Filtering** (`files.ts`, `filterFiles`). A file that fails `accept` (extension, MIME, `image/*`),
`maxSize` or `maxFiles` is not added; `onReject` gets it with the reason, and the caller sets `error`.
Type and size are checked before the count, so `'count'` is only ever a valid file that did not fit. Without
`multiple`, a pick takes the first valid file and rejects the rest as `'count'`. A file that is already in
the list (same name, size and date) is dropped without a rejection: nothing was wrong with it.

**List.** A `<ul>` between the zone and the error message, inside the frame; no fill (a fill says
"pressable", and a row is not). A row is `OptionText` (name, formatted size) and a `CloseButton` named
"Remove <name>" (now with `isDisabled`); in upload mode also the state:

- **uploading:** `Progress` bar (`size="1em"`, named "Uploading <name>"), determinate once `onProgress`
  is called and indeterminate before (the pre-signed fetch);
- **done:** a ✓ (`CheckIcon`) named "Uploaded";
- **error:** the `Error`'s message in a `FieldError` ("Upload failed" for anything without one) and a
  Retry `IconButton` named "Retry <name>".

The component keeps the state by `File` identity (`FileUpload/useFileUploads`, which does no network: it
calls `uploadFile`, keeps the status map and the `AbortController`s, and retries). One row draws every
state. Removing a row aborts its upload and calls `onChange`, so the consumer can delete what `onUploaded`
gave it. A single-file field aborts the old upload when a new file replaces it, a controlled parent that
drops a file aborts it, and unmounting aborts everything in flight. An aborted upload never reports:
its result, its failure (an `AbortError` included) and its progress are ignored, so a consumer that
ignores `signal` is still safe. `uploadFile` throwing before it returns a promise is a failure like any
other. Uploads run in parallel. Files from `defaultValue` or a controlled `value` that the user did not pick are not uploaded.

**Accessibility.** After a removal, focus goes to the next Remove button (the previous one when the last
was removed), or to the input when the list is empty. A polite `VisuallyHidden` live region (`role="status"`)
says "2 files added", "report.pdf removed", "report.pdf uploaded" and "report.pdf failed".

**Tokens.** None for the zone's fill: it is the frame's, from `--color-field-background*`. Progress, danger and the check use theirs; the ✓ is
`--color-primary-strong` in the CSS module, a fixed finish.

**Not yet:** blocking form submit while an upload is in flight or failed (`setCustomValidity` on the
input), `maxConcurrent`, pause and resume, previews, folder upload, paste, a compact button-only form, a
`labels` prop. Chunked and resumable uploads belong in the consumer's `uploadFile`. Not yet checked by eye:
the zone, the rows and the drag state were written from the CSS and tested in jsdom, which has no
`DataTransfer`, no drag-and-drop and no layout, so look at them in Storybook (and drop a real file) before
relying on them.

### Table

```tsx
type TableColumn<Row> = {
  header: ReactNode;
  cell: (row: Row) => ReactNode; // the only way a column gets its data: the table never reads the row itself
  align?: 'start' | 'center' | 'end'; // logical; default start
  width?: string | number; // a CSS length (a number is pixels)
  isRowHeader?: boolean; // its cells are <th scope="row">: they name the row
} & (
  | { isSortable: true; key: string } // only has an effect when the table has `sort` and `onSortChange`
  | { isSortable?: false; key?: string }
); // `key` is an id for the column, not a field of the row: `sort.key` is the `key` of the sorted column

type TableSort = { key: string; direction: 'ascending' | 'descending' };
type TableLabels = { selectAll?: string; selectRow?: string }; // 'Select all rows', 'Select row'

type TableProps<Row> = Omit<TableHTMLAttributes<HTMLTableElement>, 'children' | 'color'> & {
  columns: TableColumn<Row>[];
  rows: Row[]; // the rows to show, in the order to show them: this page, already sorted
  getRowKey: (row: Row) => string; // stable across reorder, reload and paging (an id)
  emptyMessage?: ReactNode; // a row of its own when there are no rows; left out: only the header
  size?: ScaleProp; // font-size; default 'normal'
  labels?: TableLabels; // another language
} & (
    | { caption: string } // the visible name, above the table
    | { caption?: undefined; 'aria-label': string }
    | { caption?: undefined; 'aria-labelledby': string }
  ) &
  // sorting: both or neither, and the parent owns it
  (
    | { sort?: undefined; onSortChange?: undefined }
    | { sort: TableSort | null; onSortChange: (sort: TableSort) => void }
  ) &
  // selection: both or neither, and the parent owns it
  (
    | { selectedKeys?: undefined; onSelectedKeysChange?: undefined }
    | { selectedKeys: string[]; onSelectedKeysChange: (keys: string[]) => void }
  );
```

Rows of data in columns, to compare and look things up. It is generic over the row (`Row` is inferred from
`rows`). Not for layout, for a few label-and-value pairs (a list), or for cards of unlike content (Grid). A
native `<table>`, so a screen reader announces the row and column of every cell.

Closest sibling is **Pagination**, its partner: the table does not page, and the parent passes one page of
`rows` with a Pagination under it. **Tabs** is the sibling for the state (see below) and for the `items`-style
array (`columns` here, as Tabs' `items` and Select's `options`: no component in the library is built from
composable parts, and a data-driven shape is what lets the table wire sorting, selection, the empty state and
loading). **Breadcrumb and Pagination** give the `size` handling (`_shared/Size.module.css`, everything in
`em`). **Shared:** those, `_shared/Placeholder` (the cells), `_shared/ChevronIcon` (the sort arrow),
and the
new `_shared/CheckControl`, extracted from Checkbox in the same change because row selection is its second
consumer (see [Checkbox](#checkbox)). **New:** the table's markup, the sort button and its wiring, the
selection logic.

- **No state of its own.** Sorting and selection decide what the rest of the screen shows (a server query, a
  toolbar of actions), so both are controlled, with no `default*` and no `useState`, as Tabs' and
  Pagination's. The table does not sort or page: it draws the arrow and reports the press, and the parent sorts
  `rows` (or asks the server to). Each pair is typed so that one half alone does not compile.
- **Sorting** (APG sortable table). A column with `isSortable` has a button in its header, named by the
  header (the direction is `aria-sort` on the `<th>`, not a second name). The first press on a column asks for
  `ascending`, then it goes back and forth; there is no third "unsorted" press (the parent can still set `sort`
  to `null`), as the APG example. `aria-sort="none"` is on a sortable header that is not the sorted one. The
  arrow is `ChevronIcon`: down for descending, turned up for ascending; hidden until the column is sorted but
  its room kept, so a header does not change width when it is, with a hint of it on hover and focus.
  `isSortable` without `sort` and `onSortChange` does nothing. A column's `key` is only an id: `cell` is what
  reads the row, and what a `sort.key` means for the rows is the parent's. A sortable column must have one
  (the type requires it); any other may leave it out and is named by its position.
- **Selection.** `selectedKeys` adds a checkbox to every row and one in the header. The header's selects every
  row **shown** (not every row there is: the table does not know them), is checked when all are, and is
  indeterminate (a dash: `CheckControl`'s `isIndeterminate`) when some are. A key that is not in `rows` (a row
  picked on another page) is kept, and `onSelectedKeysChange` gets the whole selection: the keys not shown, in
  their order, then the shown selected rows in the order of `rows`. A row's checkbox is named by its row header
  (`aria-labelledby`: "Grace Hopper, checkbox, checked"); without a row header column it is
  `labels.selectRow`. No `aria-selected` (not valid on a row of a plain table): the checkbox is the state.
- **Headers and cells.** Column headers are `<th scope="col">`; a column with `isRowHeader` has `<th
scope="row">` cells, usually one (the name). Both are heavier than a plain cell.
- **Name.** `caption` (visible, above the table) or `aria-label` / `aria-labelledby`; the type requires one,
  since a table with no name is a fault. A name only a screen reader needs is `aria-label`; there is no
  hidden-caption prop.
- **Loading** is `aria-busy="true"` on the table or on something around it, not a prop. Each cell's content is
  wrapped in a `placeholder.placeholder` span, so it becomes a block as long as it is; the headers stay as they
  are (they are known). Render a few rows of neutral text of about the right length: the table cannot know how
  many rows are coming (see [Loading](#loading)).
- **Look.** No surface (no fill, radius or shadow): put it in a Card for one. A hairline under every cell
  (`--color-table-line`); a row takes `--color-table-row-hover` under the pointer and
  `--color-table-row-selected` when selected; cells are `0.75em 1em`; digits are tabular so a column of
  numbers lines up; a header does not wrap. `border-collapse: separate`, so a row's fill is not cut by a
  shared border.
- **Motion** is on what can be pressed, with the system's: the sort button and a row's checkbox grow on hover
  on `--ease-enter` (1.06 and 1.15; the button also takes `--color-table-sort-hover`), settle to 0.95 and 0.9
  when pressed on `--ease-leave`, and under `prefers-reduced-motion` nothing scales (the fill and the arrow
  are the cues). A row is not pressable, so it changes only fill. The arrow turns on `--ease-pop`.
- **Tokens**, all aliases: `--color-table-line` (of the new neutral `--color-line`, which `--color-divider`
  now aliases too), `--color-table-row-hover` and `--color-table-row-selected` (the field's two tints),
  `--color-table-sort-hover` (the field's stronger tint). A row's checkbox has no token of its own: it is
  `CheckControl`, tick color `--color-checkbox-check` included.

**Not yet:** a scroll region for a table wider than its container (it needs a focusable, named region), a
sticky header, sticky columns, column resizing and reordering, a clickable or linked row, expandable rows, a
disabled row (`isRowDisabled`), multi-column sort, an unsorted press, a density prop, a built-in pager,
virtualization. Not yet checked by eye: the hover and press motion and the focus rings (written from the
CSS), dark mode and a right-to-left layout. Looked at in headless Edge against Storybook: the Selection,
Sorting and Loading stories at rest (the ✓ and the indeterminate dash, the selected-row tint, the sorted
arrow, the placeholder blocks).

---

### Calendar

```tsx
type CalendarView = 'days' | 'months' | 'years';

type CalendarLabels = {
  previous?: (view: CalendarView) => string; // default: 'Previous month' | 'Previous year' | 'Previous years'
  next?: (view: CalendarView) => string; // default: 'Next month' | 'Next year' | 'Next years'
};

type CalendarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'color' | 'children' | 'defaultValue'
> & {
  size?: ScaleProp; // font-size; the cells and gaps follow it; default 'normal'
  value?: LocalDate | null; // controlled; null is none
  defaultValue?: LocalDate | null; // uncontrolled
  onChange?: (value: LocalDate) => void; // the date pressed, also when it is the chosen one again
  min?: LocalDate;
  max?: LocalDate;
  isDateDisabled?: (date: LocalDate) => boolean;
  isDisabled?: boolean; // nothing can be pressed
  visibleMonth?: LocalMonth; // controlled month shown: '2026-11'
  defaultVisibleMonth?: LocalMonth;
  onVisibleMonthChange?: (month: LocalMonth) => void;
  firstDayOfWeek?: Weekday; // 0 (Sunday) to 6; default: the locale's, or Monday where the browser can't say
  locale?: string; // names of months and days; default the browser's
  labels?: CalendarLabels; // another language for the previous / next buttons
  'aria-label'?: string; // default 'Calendar'; aria-labelledby replaces it
};
```

A month of days to choose one from, drawn in place (on a page, or in a Popover). It holds a date; it is not a
field, and does not type (that is `DateField`). It is the shared core of the date and time family (see
Phase 3b), built first because `DatePicker`, `DateTimePicker` and `DateRangePicker` all put one in a popup.

Closest sibling is **Pagination**, on the cell: a round pressable thing in em, with nothing behind it until
the pointer is on it and the brand color behind the current one. That recipe was Pagination's own CSS; with
Calendar as its second consumer it moved to `_shared/RoundControl.module.css`, which both use. A consumer
sets three hooks on its own class from its own tokens (`--control-background-hover`, `-current`,
`--control-text-current`) and adds what is its own (Pagination's chevron). **Shared:** that;
`_shared/Size.module.css` for `size`; `_shared/useControlledState` for `value`; `_shared/IconButton` for
the previous and next buttons, with arrows drawn on `StrokeIcon`'s shell (flipped under `:dir(rtl)`);
`_shared/dateValue` for every value. **New:** the date grid and its keyboard, the date math
(`Calendar/calendarMath.ts`: whole days counted on UTC dates, so no daylight saving shift makes a day 23 or
25 hours), and the three views. It adds three alias tokens, as Pagination's: `--color-calendar-background-hover`
(the field's stronger tint), and `--color-calendar-background-current` with `--color-calendar-text-current`
(the brand color and its text; `themes.css` overrides both).

- **Values are local strings.** `value`, `min`, `max` and what `onChange` gives are `LocalDate`
  (`'2026-11-11'`), never a `Date` and never an instant (see
  [Date and time values](#date-and-time-values)). A value that is not one (a string with `Z`, `'2026-02-30'`)
  shows as none and logs an error in development that names the fix. A bad `value` is still controlled:
  it is not "uncontrolled", so a press cannot type over it.
- **`value` / `defaultValue` / `onChange`**, as Slider, and `null` for none. A chosen date set from outside
  (a field beside the calendar) brings the calendar to its month, unless the parent owns the month.
- **The month shown** is widget-local state, so it has `visibleMonth` / `defaultVisibleMonth` /
  `onVisibleMonthChange` (as Popover's `isOpen` / `defaultIsOpen` / `onOpenChange`), not a required
  controlled prop. Uncontrolled it is the month of the date the keyboard is on. Controlled, a press of the
  buttons only reports: nothing moves until the parent passes the new month. That is what lets two calendars
  one month apart move together (the `TwoMonths` story, and the heart of `DateRangePicker`).
- **Six weeks, always,** so the calendar is one height. The days of the months either side fill the first
  and last rows, dimmed; pressing one chooses it and turns the page. One date is in the tab order (roving
  tabindex): the chosen one, else today, else the first of the month.
- **Three views.** The name in the header ("November 2026") opens the months of that year; the year in
  that opens a page of twelve years; picking a year goes to its months, picking a month to its days. A
  birthday decades back is three presses, where the days alone are a hundred and fifty. The month and year
  grids browse with their own cursor and do not move the month shown until one is picked, so
  `onVisibleMonthChange` is not called for every arrow. The previous and next buttons mean a month, a year
  or twelve years, by view (`labels` names each). The grid keeps the days grid's height, so opening it moves
  nothing below.
- **Keyboard** (the APG date picker grid). Days: arrows move a day or a week (and turn the page at the
  edge; reversed in a right-to-left layout), Home and End the start and end of the week, Page Up and Down a
  month (a year with Shift; the 31st lands on the last day of a shorter month), Enter and Space choose.
  Months and years: arrows move 1 and 3 (the grid is three wide), Page Up and Down a year or a page,
  Home and End the first and last. Escape goes back a view and is spent there (it does not reach a
  Popover around the calendar), so a second Escape closes the popup. Moving by key does not choose.
- **Limits.** `min`, `max` and `isDateDisabled` dim a date (`aria-disabled`, not `disabled`) and a press
  does nothing, but the keyboard still passes over it, as the pattern asks. The keyboard cannot leave
  `min`..`max`. The previous and next buttons stop at the limit, and a month or year with no choosable
  date is dimmed in its grid.
- **Accessibility.** A `role="group"` named by `aria-label` (default `Calendar`). The days are a
  `role="grid"` named by the header; weekday column headers carry the full name in `abbr`; each cell is a
  `gridcell` with `aria-selected` holding a button named with the full date ("Wednesday, November 11,
  2026"), `aria-current="date"` for today. The header is an `aria-live="polite"` region, so turning the page
  says which month it turned to. Month and year cells are a `role="group"` of buttons with
  `aria-current="true"` on the one in view.
- **Look.** The cells are RoundControl's (2.25em high, round, the spring on hover and the shrink on press,
  the fill that pops in on the chosen one). Today is a ring in `--color-primary-strong` (the plain primary is
  too pale to read as a line), gone under the fill when it is chosen; in `forced-colors` it is an
  outline. The header name is a pill that grows less on hover (1.04) than a day, since it is wide, and it
  ends in a ⌄ (`_shared/ChevronIcon`) because it is pressable and nothing else would say so; the years page's
  name is static and has none. The
  weekday row is quiet (`--color-text-less`). All em, so `size` scales it. The text is `Intl`'s, from `locale`.
- **`firstDayOfWeek`** defaults to the locale's, from `Intl.Locale`'s `getWeekInfo()` (`weekInfo` in older
  Chrome and Safari). Where the browser has neither (Firefox, for now), Monday.

**Not yet:** a range highlight and per-day rendering (needed by `DateRangePicker`: it will take a `range`
and the hover preview), week numbers, showing several months in one calendar, animating the page turn, a
Today shortcut, a `disabledMonths` shorthand, non-Gregorian calendars. The previous and next buttons use
native `disabled` at a limit, so a keyboard user pressing one to its end loses focus to the body (Pagination
avoids it with `aria-disabled`; `IconButton` has no such mode yet). **Not yet checked by eye:** the
layout and motion were written from the CSS and tested in jsdom, which has no layout, no hover and no
`Intl` week data beyond Node's; look at it in Storybook (all three sizes, dark, a right-to-left `locale`
page) before relying on it.

### DateField

```tsx
type DateFieldLabels = {
  day?: string; // what a screen reader says on the segment; default 'Day'
  month?: string; // 'Month'
  year?: string; // 'Year'
  empty?: string; // for a segment with nothing in it; default 'empty'
};

type DateFieldPlaceholders = { day?: string; month?: string; year?: string }; // default 'dd' 'mm' 'yyyy'

type DateFieldProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'color' | 'role' | 'children' | 'placeholder'
> &
  NameProps & {
    size?: ScaleProp; // default 'normal'
    label?: string;
    error?: string; // marks it invalid and shows this message
    name?: string; // a hidden input submits the date, '1988-03-14', or '' for none
    value?: LocalDate | null; // controlled; null is none
    defaultValue?: LocalDate | null; // uncontrolled
    onChange?: (value: LocalDate | null) => void; // a date once the three segments spell one; null when they stop
    locale?: string; // the order of the segments and the separators; default the browser's
    labels?: DateFieldLabels;
    placeholders?: DateFieldPlaceholders;
    isDisabled?: boolean;
    isReadOnly?: boolean;
    isRequired?: boolean;
  };
```

A date typed into three segments (day, month, year, in the order the locale writes them) in one field. It
is the birthday case: a date you know by heart and that is decades back, where a calendar is a hundred and
fifty clicks and three dropdowns are three opens. There is no popup; `DatePicker` adds one. Forwards its ref
to the first segment, the one the label points at.

Closest sibling is **TextField**, through `_shared/TextFieldFrame`: root, `size`, label, error message, and
the id / `aria-invalid` / `aria-describedby` wiring. The control is a `role="group"` box (the frame's
`.control` class on a `<div>`, as Select's multiple field and FileUpload's zone), so the fill, the hover
and the focus border are the frame's; the frame shows focus on the box when a segment inside has it
(`:has(:focus-visible)`). **Shared:** the frame, `_shared/useControlledState` for `value`,
`_shared/dateValue` for every value (a `LocalDate`, validated with `warnIfNotLocal`; a string with a zone
shows as none and logs an error that names `fromInstant`). **New:** the segments (`DateField/segments.ts`
is their logic: the locale's layout, typing, stepping, pasting, with its own tests) and
the look of a segment. The field's fill is the shared `--color-field-background*` with no DateField alias (every
field looks the same, so there is nothing to customise on its own). It adds only
`--color-datefield-segment-background-active` with `--color-datefield-segment-text-active` (the brand color
and its text, as Calendar's chosen day; `themes.css` overrides both). The frame gave the label an id and a
third argument to its `children` (`{ labelId }`), because a group is named by `aria-labelledby` where an
input is named by a `<label for>`; the first segment also carries the frame's `id`, so a press on the label
enters it.

- **Segments are inputs, not spans.** Three real `<input inputMode="numeric">`: the numeric keyboard on a
  phone, a caret and selection that the platform draws, autofill, IME. Each is `role="spinbutton"` with
  `aria-valuemin` / `-max` / `-now` / `-text` and a name from `labels` ("Day"), so a screen reader says "Day,
  spin button, 14". The separators between them are `aria-hidden` text. `aria-invalid` and
  `aria-describedby` are on every segment, since a group is not announced again as focus moves inside it.
- **Order and separators are the locale's**, from `Intl.DateTimeFormat(locale).formatToParts` (month, day,
  year in the US; year, month, day in Japan; `.` in Germany; `. ` in Korea, space kept). A locale the
  browser doesn't know gets day / month / year with `/`. The digits are Latin, in every locale.
- **Typing.** A digit goes into the segment and, when nothing more could follow, focus moves on by itself:
  a day typed `4` is `04` at once (there is no `4x`), `3` waits for a second digit, `35` is no day so the 5
  starts again as `05`, `00` is ignored; a year takes four digits. Entering a segment starts it afresh, so
  there is nothing to select first. `14031988` types a whole date. A one-digit segment is padded when it
  loses focus (`3` becomes `03`). Letters are ignored; a separator (`/`, `.`, `-`, space) finishes the
  segment as it would on paper. A phone's keyboard, which sends no keys, goes through `onChange` and ends up
  in the same place.
- **Keys.** Up and Down step a segment: a day and a month wrap (31 → 1, 12 → 1), a year stops at 1 and
  9999, and a day stops at the end of the month once month and year are known; an empty segment takes
  today's, whichever key, as the native input does. Left and Right move between segments (reversed in a
  right-to-left layout, and not past the ends). Backspace and Delete clear the segment, and Backspace in an
  empty one goes back to the one before. Anything with Ctrl, Meta or Alt is left to the browser (paste,
  and Alt+Down, which `DatePicker` uses to open).
- **Paste** takes a date in one go: ISO (`1988-03-14`) or three numbers in the locale's order
  (`14.03.1988`). Two-digit years are refused, not guessed; anything else is ignored.
- **What `onChange` gives** is a `LocalDate` the moment the three segments spell one, and `null` when they
  stop (cleared, unfinished, or a day that doesn't exist: 31 February). It does not say which; the caller
  validates when the user leaves the field and says so with `error`, as for TextField. The one thing the
  field marks itself is a complete but impossible date: every segment gets `aria-invalid`.
- **Controlled** means what it does elsewhere, and it is strict: the segments are what is typed, and when
  `value` and the typed date disagree, `value` wins, so a parent that does not take a change gets the old
  date back. A parent that sets `value` to `null` empties the segments; a half-typed date in a field whose
  `value` is already `null` is kept.
- **Focus events** are the field's, not each segment's: `onFocus` and `onBlur` are called when focus enters
  and leaves the group, not when it moves from day to month. A press on the field's padding enters the first
  segment.
- **Look.** The field is TextField's (same height, fill and hover). The segments are bare, in tabular
  figures, as wide as their placeholder ("yyyy"); the one with the keys has the brand color behind its text
  (the native date input's way), since the box's focus border can't say which of three. The placeholder is
  the dimmed text of the others. In `forced-colors` the focused segment is an outline. Read-only is the
  frame's plain text, no mark of focus, out of the tab order; disabled is the frame's.
- **`DateFieldBase`** is the same component with an `end` slot (buttons inside the field, as the password
  reveal), which `DatePicker` fills with its calendar button. It is not exported from the package:
  `DateField` is it without the slot.

**Not yet:** `min` / `max` (what is typed is the caller's to check; `DatePicker` limits only its
calendar), a message the field writes itself ("Not a real date"), month names as a segment (`14 March 1988`),
two-digit years, Home / End and Page Up / Down on a segment, non-Latin digits, non-Gregorian calendars.
**Not yet checked by eye:** the look was written from the CSS and tested in jsdom; look at it in Storybook
(all three sizes, dark, the locales, read-only) before relying on it.

### DatePicker

```tsx
type DatePreset = { label: string; value: LocalDate };

type DatePickerLabels = DateFieldLabels &
  CalendarLabels & {
    calendar?: string; // the button that opens the calendar, and its popup; default 'Choose date'
  };

type DatePickerProps = Omit<DateFieldProps, 'labels'> & {
  min?: LocalDate; // the calendar's and the presets' limits, not the typing's
  max?: LocalDate;
  isDateDisabled?: (date: LocalDate) => boolean;
  firstDayOfWeek?: Weekday; // default: the locale's
  presets?: DatePreset[]; // shortcuts under the calendar
  labels?: DatePickerLabels;
  isOpen?: boolean; // controlled; pair with onOpenChange
  defaultIsOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};
```

A `DateField` with a calendar button at its end that opens a `Calendar` in a popup: the date near today
(a booking, a due date), where seeing the month helps and typing is the shortcut. Either way sets the same
value, and the open calendar follows what is typed. Choosing a day, or a preset, closes it. Props are
`DateField`'s plus the calendar's (`min`, `max`, `isDateDisabled`, `firstDayOfWeek`; `locale` and `size` go
to both) and `presets`.

Closest sibling is **DateField** (it renders `DateFieldBase`), then **Popover**, which it uses as it is,
and **TextField** for the button in the field. **Shared:** the field, the label, the error and the value
handling are DateField's; the button is `_shared/IconButton` in the frame's `end` slot, as the password
reveal; the popup, its focus return, Escape and outside press, and its placement are Popover's
(`align="end"`, anchored on the button, which is the Popover's trigger); the days are Calendar; the presets
are selectable `Chip`s. **New:** the calendar icon (`DatePicker/CalendarIcon.tsx`, on `StrokeIcon`'s
shell) and the wiring. It adds no token: the field's are `--color-datefield-*`, the popup's is Popover's,
the calendar's are Calendar's. What changed elsewhere for it: `IconButton` takes a `ref` and the other button
attributes (Popover clones its trigger with `aria-expanded`, `aria-haspopup` and a ref; `onClick` now gets
the event), `Popover` takes a `className` and its `max-height` is the hook `--popover-max-height` (a
calendar and a row of presets are taller than 24em), and Calendar's "is this date unavailable" moved to
`calendarMath` (`isUnavailable`) for the presets to use.

- **The value lives in DatePicker**, not in the field: the calendar shows it too. The field below it is
  always controlled by it. `value` / `defaultValue` / `onChange` are DateField's, with `null` for none.
- **Opening.** The button, or Alt+Down in any segment (the date picker pattern), opens it; Escape (the
  first one goes back a calendar view, as Calendar says, and the second closes), a press or focus outside,
  and the button again close it. Opened by the person, focus goes to the day the calendar's keyboard
  starts on (the chosen one, else today), so the next key walks the days. One that starts open
  (`defaultIsOpen`) or is opened by the caller (`isOpen`) takes no focus from where the person is.
  Closing with focus inside returns it to the button.
- **`min`, `max` and `isDateDisabled` are the calendar's.** They dim days, months and years there and
  disable a preset that is outside them. They do not stop typing: the field takes whatever date is typed,
  as a text field takes text, and the caller checks it (`value < min` compares as dates do) and says so with
  `error`. A date typed outside the limits shows as the chosen one, dimmed, in the calendar.
- **Presets** are `{ label, value }` with a `LocalDate`, computed when you render (`today()`, never a
  constant, or "Today" is the day the module loaded). A preset that is the value is pressed (`aria-pressed`).
- **Size.** The calendar and the chips take the field's `size`, so the popup is the field's em; the popup is a
  DOM child of the field's root though it is shown in the top layer.
- **Labels.** `labels` is DateField's names, Calendar's `previous` / `next`, and `calendar`, the name of the
  button and of the popup.
- **Read-only and disabled** switch the button off, and Alt+Down does nothing.

**Not yet:** a Today / Clear row of fixed buttons, closing on a press of the chosen day, limits on typing
(see above), a time (that is `DateTimePicker`). **Not yet checked by eye:** the popup's placement and size,
and the button in the field, were written from the CSS and tested in jsdom, which has no layout or anchor
positioning; look at it in Storybook (all sizes, dark, near the bottom of the viewport, right-to-left)
before relying on it.

### Date and time values

Not a component: the value types and helpers that the date and time family shares (`Calendar`,
`DateField`, `DatePicker`, `TimeField`, `DateTimePicker`, `DateRangePicker`; see Phase 3b). Written first,
because the mistake they invite is the same in all of them.

```tsx
type LocalDate = `${number}-${number}-${number}`; // '1988-03-14'
type LocalTime = `${number}:${number}`; // '14:30'  (24 hours, minute resolution)
type LocalDateTime = `${LocalDate}T${LocalTime}`; // '2026-11-11T14:30'
```

**A value is what the user read off a calendar or a clock. It is not a moment in time.** It has no time
zone and never an offset or `Z`. The components take and give these strings, never a `Date`, and the
names say "local" so that a prop reads wrong when it is fed an instant.

**Instant vs local value.** An _instant_ is one exact moment on the world's timeline, the same for
everyone: `'2026-11-11T13:30:00.000Z'` (the `Z` means UTC; `'2026-11-11T14:30:00+01:00'` is the same moment
written with an offset). A _local value_ is only a reading of a clock, which is a different moment in each
place: `'2026-11-11T14:30'` is 13:30 UTC if it is 2:30 pm in Paris and 19:30 UTC if it is 2:30 pm in New
York, and the string is the same in both. Servers and databases usually store instants, because they are
unambiguous; the pickers deal in local values, because that is all the user chose. The helpers below turn
one into the other, and only a date **with** a time ever needs it.

- **`LocalDate`** is a calendar date: a birthday, a due date. It is not an instant at all, so there is
  nothing to convert; send it as it is (a `DATE` column, a `YYYY-MM-DD` field).
- **`LocalTime`** is a reading of a wall clock (opening hours, an alarm). Send it as it is.
- **`LocalDateTime`** is a wall-clock reading in some zone. A server that wants an instant needs that zone
  from you, so the conversion is the developer's call, and the library offers it rather than hides it.

**Helpers** (`_shared/dateValue.ts`, exported; no dependency, `Intl` only):

| Helper                                            | Does                                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `toDate(value)`                                   | `LocalDate` (midnight) or `LocalDateTime` → a `Date` in the browser's zone, built from the parts                   |
| `fromDate(date, kind?)`                           | a `Date` → `LocalDate` (default), or `'time'` → `LocalTime`, `'dateTime'` → `LocalDateTime`, in the browser's zone |
| `toInstant(value, timeZone?)`                     | `LocalDateTime` → UTC ISO string with `Z`, in `timeZone` (default: the browser's)                                  |
| `fromInstant(iso, timeZone?)`                     | an ISO instant (with `Z` or an offset), or a `Date` → `LocalDateTime`, the reverse; no zone in the string throws   |
| `today(timeZone?)`                                | today's `LocalDate`; use it for `min` / `max` and the Today preset                                                 |
| `isLocalDate` / `isLocalTime` / `isLocalDateTime` | type guards: the shape, and a day that exists                                                                      |

They throw a `RangeError` for a value that is not valid (a day that doesn't exist, a string with a zone
given to `toInstant`, a time zone that doesn't exist): a wrong date is worse than a loud one. The
components, which take values from forms and servers, do not throw: they show none and log in
development. The module also has the parsers and formatters the components use (`parseLocalDate`,
`formatLocalDate`, `daysInMonth`, ...), which are not exported from the package.

**What to tell developers** (Storybook "Sending to a server" story, one case per rule):

1. **Sending a `LocalDateTime`:** `toInstant(value)` when the user meant their own zone. When the event
   is somewhere else (a table at a restaurant in another city), the value is that place's wall clock:
   `toInstant(value, 'Europe/Paris')`. The browser's zone is the wrong one then.
2. **Receiving one:** `value={fromInstant(booking.startsAt, zone)}`, never `value={booking.startsAt}`. A
   string with `Z` or an offset is not a `LocalDateTime`. The field shows empty and logs an error in
   development that names `fromInstant` (it never guesses a conversion, which would show a wrong time).
3. **Never `new Date('1988-03-14')`.** A date-only string is read as UTC midnight, so west of Greenwich it
   is the 13th; `'1988-03-14T00:00'` is read as local time. Use `toDate`, which builds from the parts.
4. **Never `date.toISOString().slice(0, 10)`** to get a `LocalDate` (it is the UTC date, so it is a day off
   for a few hours each day). Use `fromDate`.
5. **A time that does not exist** (02:30 on the day the clocks go forward) or happens twice (the day they
   go back) is resolved as `Date` and Temporal's "compatible" mode do: forward over the gap, the earlier
   of the two. A booking form can check with `fromInstant(toInstant(value, zone), zone) === value`.
6. **Forms:** the hidden input behind `name` submits the same local string. A plain HTML form post therefore
   sends a local value; convert on the server only if the zone is also sent.
7. **Comparing:** two values of the same type compare correctly as strings. `min`, `max` and a range's
   `start` / `end` are `LocalDate` (a range's `end` is the last day, inclusive).

**Not yet:** seconds, a `Temporal` adapter, a `Date`-typed overload (left out on purpose: it would put the
zone question back). Time zone conversion uses `Intl.DateTimeFormat`, so it is as good as the browser's
zone database.

## Loading

There is no `Skeleton` component and no `isLoading` prop. Loading is the **state of a region**: set
`aria-busy="true"` on any element (a Stack, a Card, a Text) and the Text, Title, Avatar and option text inside
become quiet blocks. The caller's only switch is one attribute.

```tsx
<Stack aria-busy={isLoading}>
  <Avatar
    isTextShown
    name={user?.name ?? 'Loading name'}
    description={user?.role ?? 'Loading role'}
  />
  <Text as="p">{user?.bio ?? 'A placeholder about as long as the real bio'}</Text>
</Stack>
```

- **The real components are rendered, with placeholder content**, so the layout is the real one and the
  height matches by construction. There is no second, skeleton-shaped layout to keep in step, and no
  blank space reserved for it. The width of a block is the width of its placeholder text, so pick one of
  about the right length.
- **`_shared/Placeholder.module.css`** holds the whole recipe once. A component puts `placeholder.placeholder`
  on the part that becomes a block (Text's root, Avatar's circle, `OptionText`'s label and description);
  the class does nothing until that part or an ancestor has `aria-busy="true"` (`:global([aria-busy='true'])`,
  since the switch is the caller's attribute, not a class of the module). In it: the block's color
  (`--color-placeholder`, its own recipe: the brand color at 22%, so the fields' tokens can change without it), the text
  and a child's drawing hidden (`color: transparent`, `visibility: hidden` on children), `user-select: none`,
  `box-decoration-break: clone` so an inline Text wrapping onto lines gets a block per line, and a slow
  opacity pulse. A block-level element (`as="p"`) is one rectangle, not one per line.
- **Motion** is the pulse only, and its last frame equals its first, so with `prefers-reduced-motion` it
  rests on a solid block.
- **Radius** is `0.25em`, set through `:where()` so it has no specificity and Avatar keeps its circle.
- **Accessibility.** `aria-busy` is the standard way to say a region is updating. The placeholder text is
  still in the DOM, so keep it neutral; it is not read where a screen reader skips a busy region, but this
  is not guaranteed. Placeholder state is **not** `disabled`: buttons and fields inside stay clickable.
- **The count of rows is not solved here.** A region does not know how many results are coming. Render a
  few placeholder rows (what fits above the fold), keep the old content while refetching
  (`useTransition`), or use Spinner when the shape is unknown, so the page does not jump.

**Not yet:** Button, Chip, the fields, Card and Banner do not turn into blocks (only text and pictures
do); a standalone placeholder for something with no content to render (an image, a chart), a
`1lh`-high block for that.

---

## Theme Provider (Optional React API)

```tsx
// theme/ThemeProvider.tsx
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string; // localStorage key
  enableSystem?: boolean; // Watch prefers-color-scheme
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey,
  enableSystem = true,
  disableTransitionOnChange = true,
}: ThemeProviderProps) {
  // 1. On mount: read localStorage / system preference
  // 2. Apply data-theme="light|dark" to document.documentElement
  // 3. Watch for system changes (if enableSystem)
  // 4. Persist user choice (if storageKey)
  // 5. Provide context for useTheme() hook
  // Note: renders null until it has mounted (to avoid a hydration mismatch), so on a server-rendered
  // page nothing inside it is in the HTML. The README tells SSR users to skip it for a <head> script.

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// hooks/useTheme.ts
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

---

## Consumer Extensibility

### Using Design Tokens in Custom Components

```tsx
// Consumer's custom component
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

// Usage - identical mental model
<StatCard value="$12,345" label="Revenue" size="more" borderRadius="more" />
<StatCard value="1,234" label="Users" size="less" boxShadow="less" />
<StatCard value="99%" label="Uptime" borderRadius="12px" />  // Escape hatch
```

### Accessing Tokens in JavaScript (Charts, Canvas)

```tsx
// hooks/useTokens.ts
export function useTokens() {
  const { resolvedTheme } = useTheme();
  return {
    colors: {
      primary: getCSSVariable('--color-primary'),
      // ...
    },
    size: {
      less: getCSSVariable('--size-less'),
      normal: getCSSVariable('--size-normal'),
      more: getCSSVariable('--size-more'),
    },
    // ...
  };
}

// utils/cssVars.ts
export function getCSSVariable(name: string, element = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}
```

---

## Project Structure

```
more-or-less-ui/
├── package.json
├── tsup.config.ts
├── tsconfig.json
├── vite.config.ts          # Optional — Storybook/Vitest work without it
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── src/
│   ├── index.ts            # Public exports
│   ├── theme/
│   │   ├── tokens.css      # Scale (15 vars) + color tokens
│   │   ├── themes.css      # Dark-mode overrides
│   │   ├── ThemeProvider.tsx
│   │   └── index.ts
│   ├── types/
│   │   └── scale.ts        # ScaleProp, Variant, isVariant
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useMediaQuery.ts
│   │   └── useTokens.ts
│   ├── utils/
│   │   ├── cssVars.ts
│   │   └── clsx.ts         # Re-export
│   ├── components/         # Flat: one folder per component. Grouping (Layout, Actions, ...)
│   │   │                   # lives only in the Storybook story `title`.
│   │   ├── Avatar/
│   │   ├── Banner/
│   │   ├── Chip/
│   │   ├── Divider/
│   │   ├── Indicator/
│   │   ├── Spinner/
│   │   ├── Progress/
│   │   ├── Box/
│   │   │   ├── Box.tsx
│   │   │   ├── Box.module.css
│   │   │   ├── Box.stories.tsx
│   │   │   └── index.ts
│   │   ├── Button/
│   │   ├── Stack/
│   │   ├── Grid/
│   │   ├── Text/
│   │   ├── Card/
│   │   ├── TextField/
│   │   ├── Textarea/
│   │   ├── Slider/
│   │   ├── FileUpload/     # FileUpload + files.ts (accept, size, DataTransfer sync) + useFileUploads
│   │   ├── Select/
│   │   ├── Dialog/
│   │   ├── Drawer/
│   │   ├── Menu/
│   │   ├── Popover/
│   │   ├── Toast/
│   │   ├── Tabs/
│   │   ├── SegmentedControl/
│   │   ├── Collapsible/
│   │   ├── Link/           # Link + LinkProvider
│   │   ├── Breadcrumb/
│   │   ├── Pagination/
│   │   ├── Calendar/       # + calendarMath (the grid and date arithmetic), DayGrid, ChoiceGrid (months and years)
│   │   ├── DateField/      # + segments (the locale's layout, typing, stepping, pasting)
│   │   ├── DatePicker/     # + CalendarIcon
│   │   ├── Table/
│   │   ├── Tooltip/
│   │   ├── _shared/        # Shared by several components (Gap: Stack + Grid; OptionGroup: Checkbox + Radio + SegmentedControl's frame, and Toggle's control; OptionGroupFrame: Checkbox + Radio + SegmentedControl (the fieldset, legend and error); useChoice: Radio + SegmentedControl (single-choice state); useControlledState: useChoice + FileUpload (controlled or kept here); SlidingThumb: Tabs + SegmentedControl; TextFieldFrame: TextField + Textarea + Select + Slider + FileUpload + DateField (its end slot: TextField's buttons, DatePicker's calendar button; `labelId` for DateField's group); FieldError, FieldLabel (and its ⓘ tooltip button, InfoIcon), types: all fields; IconButton: CloseButton + TextField's reveal and steppers + DatePicker's calendar button; CloseButton: Banner + Toast + Dialog + Drawer (through ModalFrame) + FileUpload's remove; ModalFrame: Dialog + Drawer; usePresence: useOverlay + Toast; ToastHost: ModalFrame + ToastProvider; VisuallyHidden: Toast's announcer; OptionText + OptionIcon: options, FileUpload's zone and rows, Button's icon, Chip's and Tabs' (OptionText also: Avatar's name and description); Placeholder: Text + Avatar + OptionText + Table's cells, the block they become inside aria-busy; Size.module.css: Spinner + Progress + Toast + Tabs + Collapsible + Link + Breadcrumb + Pagination + Table; Ring: Spinner + Progress's circle; StrokeIcon: the shell of the three icons below; CrossIcon: Select + Banner + Chip; CheckControl: Checkbox + Table's row selection (the box and tick); CheckIcon: Checkbox's control (through CheckControl) + Toggle + Select + Chip; ChevronIcon: Select + Collapsible + Breadcrumb + Pagination + Table's sort arrow; RoundControl.module.css: Pagination + Calendar (the round pressable cell); dateValue: Calendar + DateField + DatePicker, and the date and time family after it (local value types, and the helpers to and from instants); useOverlay + Overlay.module.css: Select's popup + Tooltip + Popover + Menu (Toast takes only the CSS, through floatingClass); OptionList.module.css: Select's popup + Menu; optionNavigation: Select + Menu + Tabs (stepEnabled); useTriggerRef: Tooltip + Popover + Menu; useLinkProps: Link, and so Breadcrumb's items, and Pagination's links)
│   │   └── index.ts
│   ├── patterns/
│   │   ├── CompoundComponent.tsx
│   │   └── index.ts
│   └── styles.css          # Global styles + CSS variable registration
├── (stories live next to their component as *.stories.tsx)
└── tests/                  # Vitest tests
```

---

## Public API (src/index.ts)

```typescript
// Theme
export { ThemeProvider, useTheme } from './theme/ThemeProvider';
export { tokens, type ColorToken, type SpacingToken } from './theme/tokens';
export { getCSSVariable, getAllTokens } from './utils/cssVars';

// Components
export { Box } from './components/Box';
export { Stack } from './components/Stack';
export { Grid } from './components/Grid';
export { Text } from './components/Text';
export { Button } from './components/Button';
export { Card } from './components/Card';
export { TextField } from './components/TextField';
export { Textarea } from './components/Textarea';
export { Slider } from './components/Slider';
export { FileUpload } from './components/FileUpload';
export { Select } from './components/Select';
export { Calendar } from './components/Calendar';
export { DateField } from './components/DateField';
export { DatePicker } from './components/DatePicker';
// Date and time values (local strings, not instants) and the helpers to and from a server's
export { toDate, fromDate, toInstant, fromInstant, today } from './components/_shared/dateValue';

// Patterns
export { createCompoundComponent } from './patterns/CompoundComponent';

// Hooks
export { useMediaQuery } from './hooks/useMediaQuery';
export { useTokens } from './hooks/useTokens';

// Types
export type { ScaleProp, Variant } from './types/scale';
export type { BoxProps } from './components/Box';
export type { CardProps } from './components/Card';
export type { ButtonProps } from './components/Button';
// ...
```

---

## Consumer Theming Guide

The README's "Customizing the look" and "Dark mode" sections are the guide users read; keep them in step
with this one. This is the short form.

### 1. Override Design Tokens (Global)

```css
/* globals.css */
@import 'more-or-less-ui/styles.css';

:root {
  --size-less: 0.75rem;
  --size-normal: 1rem;
  --size-more: 1.5rem;

  --radius-less: 0;
  --radius-normal: 0.5rem;
  --radius-more: 1rem;

  --color-primary: #ec4899;
}
```

### 2. Light/Dark Mode (CSS)

```css
/* The dark overrides (themes.css) apply only under <html data-theme="dark">, which sets
   color-scheme: dark itself. Set the attribute (ThemeProvider does, or a script in <head>). */

/* A bare media query darkens the page and the form controls, but gets none of the dark fills
   and shadows, because they are under the attribute: */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}
```

### 3. Programmatic Theme Switching (React)

```tsx
import { ThemeProvider, useTheme } from 'more-or-less-ui';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="my-app-theme">
      <Header />
    </ThemeProvider>
  );
}

function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

---

## Storybook Stories Pattern

```tsx
// components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['less', 'normal', 'more'] },
    borderRadius: { control: 'select', options: ['less', 'normal', 'more'] },
    fontWeight: { control: 'select', options: ['less', 'normal', 'more'] },
    boxShadow: { control: 'select', options: ['less', 'normal', 'more'] },
    padding: { control: 'select', options: ['less', 'normal', 'more'] },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = { args: { children: 'Button' } };
export const SizeMore: Story = { args: { size: 'more', children: 'Large Button' } };
export const SizeLess: Story = { args: { size: 'less', children: 'Small Button' } };
export const RadiusMore: Story = { args: { borderRadius: 'more', children: 'Rounded' } };
export const EscapeHatch: Story = {
  args: {
    size: '1.5rem',
    borderRadius: '50%',
    fontWeight: 700,
    children: 'Custom',
  },
};
```

---

## Implementation Checklist

### Phase 1: Foundation

- [ ] `types/scale.ts` — `ScaleProp`, `Variant`, `isVariant`
- [ ] `theme/tokens.css` — 15 scale CSS variables
- [x] Color tokens in `theme/tokens.css` — Minimal: one primary color + Card and Button background scales
- [ ] `theme/themes.css` — Light/dark theme definitions
- [ ] `theme/ThemeProvider.tsx` + `useTheme` hook
- [ ] `utils/cssVars.ts` — `getCSSVariable`, `getAllTokens`
- [ ] `src/styles.css` — Global entry point

### Phase 2: Primitives

- [x] `Box` — padding and margin only (incl. per-side), no defaults
- [x] `Stack` — the one flex component: `direction`, `gap`, `align`, `justify`, `wrap`; renders a Box; replaces Flex
- [x] `Grid` — `columns` (a count, or `{ minWidth }` to fit by width), `gap`; renders a Box
- [x] `Text` — `as`, `size`, `fontWeight`, `color`; every scale prop defaults to `normal`, no margin

### Phase 3: Components

- [x] `Button` — size, background, icon (icon-only without children), isDisabled, isLoading
- [x] `TextField` — size, label, error, isDisabled, isReadOnly, isRequired
- [x] `Checkbox` — options, orientation, minChecked/maxChecked, label, error, isDisabled (no `size`)
- [x] `Radio` — options, orientation, label, error, isDisabled, isRequired (no `size`); shares `_shared/OptionGroup` with Checkbox
- [x] `Select` — options, isSearchable, onSearch (async options), isLoading, isMultiple (chips), isClearable, placeholder, label, error, isDisabled, isRequired, size; one component for select and autocomplete; shares `_shared/TextFieldFrame` with TextField
- [x] `Textarea` — size, rows, resize, label, error, isDisabled, isReadOnly, isRequired; shares `_shared/TextFieldFrame` with TextField
- [x] `Toggle` — label, description, checked/defaultChecked, isDisabled (single boolean, no `size`, no `error`); no option row, on / off shown by position, fill and icon
- [x] `Banner` — size, background (brand color at three strengths, no info/error kinds), title, onDismiss; `role="status"`
- [x] `Chip` — one of three, never mixed: a static label (no handler; outlined, nothing reacts), removable (onRemove: × and a whole-chip click target, isInField) or selectable (isSelected, onSelectedChange: a `button` with `aria-pressed`, a ✓ when selected); size, children (the label), icon, isDisabled (not on a static one); no `borderRadius` or `background` (fixed). Select's former `SelectChip`, now public and used by Select
- [x] `Avatar` — size, src, name, alt, description, isTextShown (one switch for the name and description beside it; tooltip when off, to come); falls back to children, then initials, then a glyph; background color is derived from `name` (no `background` prop); name and description beside it use `_shared/OptionText`
- [x] `Card` — the former Box: radius, shadow, background, padding (no margin); renders a Box. Still to add: slots, interactive variant, semantic element

### Phase 3b: Components still to build

What is missing, from comparing the built set with the inventories of shadcn/ui, Radix, MUI, Chakra
and Mantine (a comparison from knowledge, not a survey). The built set covers forms and layout; what
is missing is display, overlays, navigation and feedback. The order is the order to build in. Each
item names its closest existing sibling, as CLAUDE.md asks, so the plan starts from what is shared.

**Foundations first** (small, and the rest stand on them):

- No `Icon` component, and no icon set. The consumer brings the icon library; every `icon` prop takes a `ReactNode` and `_shared/OptionIcon` is its one slot (decorative, `aria-hidden`). A second glyph slot beside it would only repeat it, and a library's own `size` and `color` props already cover sizing. If standalone icons outside an `icon` prop are ever needed, export `OptionIcon` under a better name rather than adding a new component
- [ ] `Portal` — utility the overlays need. `VisuallyHidden` is built, in `_shared/` and not exported (Toast's announcer uses it); export it if a consumer needs it
- [x] `Spinner` — size (unset: 1em, as big as the surrounding text), named by `aria-label` or hidden; moved out of `_shared/` (Button, Select use it)
- [x] Overlay primitive in `_shared/` (`useOverlay` + `Overlay.module.css`; see [Overlay](#overlay)) — extracted from Select's former `useSelectPopup` in the same change as Tooltip, its second consumer. Outside-click dismissal, focus return and controlled state arrived with Popover, as opt-in options

**Display and feedback** (no overlay, no state machine):

- [x] `Indicator` — the **dot or count** pinned to a corner of what it wraps (an unread "3", an online dot). count / max / isZeroShown / isHidden, corner (logical corners), overlap (`rectangle` / `circle`), size, label (decorative until named). Brand color, never red; the fill aliases `--color-primary-strong` (the plain primary is 2.1:1 on white). Avatar's status dot is `<Indicator overlap="circle">`
- [x] `Divider` — orientation (`horizontal` / `vertical`); a one-pixel `<hr>` in `--color-divider`, no margin (the layout's gap spaces it, as Card's); no scale props
- [x] `Progress` — shape (`bar` / `circle`), size, value / max (no value: indeterminate), named by `aria-label` or `aria-labelledby`; the indeterminate circle is Spinner
- [x] ~~`Skeleton`~~ — not a component: loading is `aria-busy` on a region, and Text, Avatar and `OptionText` become blocks (`_shared/Placeholder`; see Loading). A wrapper means a second layout to keep in step and heights to match by hand. Still open: Button, Chip, fields, a block for an image or chart
- [ ] `List` — rows of Avatar + OptionText; Sibling: Avatar with `isTextShown`

**Overlays** (build on the primitive above):

- [x] `Tooltip` — content, placement, delay, isDisabled; wraps nothing. Still to do: Avatar's `isTextShown={false}` shows the name and description in one
- [x] `Popover` — trigger prop and content as children (the reverse of Tooltip), placement, align, isOpen / defaultIsOpen / onOpenChange, a required name; non-modal. Added outside-click dismissal, focus return and controlled state to `useOverlay` as opt-in options, and `_shared/useTriggerRef`
- [x] `Menu` (dropdown) — trigger prop and `items`, `onSelect`, placement, align, isOpen / defaultIsOpen / onOpenChange; roving focus on `menuitem` buttons (APG). Extracted Select's popup surface and rows into `_shared/OptionList.module.css`, its keyboard helpers and type-ahead into `_shared/optionNavigation`, and `TriggerProps` into `_shared/useTriggerRef`. Still to do: separators / groups, checkable items, submenus
- [x] `Dialog` — a native `<dialog>` with `showModal()` (the page inert, so Tab stays inside; the backdrop), through `useOverlay`'s new `isModal`; optional trigger, `title`, `actions`, `isBackdropClosing`, isOpen / defaultIsOpen / onOpenChange. Named Dialog, not Modal (see [Dialog](#dialog)). Escape now closes only the topmost overlay, and `anchored` is split out of `Overlay.module.css`'s `overlay` class
- [x] `Drawer` — Sibling: Dialog; the same modal floating beside an edge (`placement`: start, end, top, bottom; every corner rounded, a 1em gap) with a slide in place of the grow, and `isBackdropShown` to keep the page unveiled. Extracted Dialog's behavior and structure into `_shared/ModalFrame`, added `dockedClass` and the slide to the overlay, and renamed Dialog's two color recipes to the neutral `--color-modal-background` / `--color-modal-backdrop`, which `--color-dialog-*` and `--color-drawer-*` alias. Still to do: a width / `size`, a sticky header and actions
- [x] `Toast` — Sibling: Popover, through Overlay (it was a Banner first; it floats, so it takes the overlay's frosted surface, corners and motion through `floatingClass`, and has no `background` prop). `ToastProvider` + `useToast()` (`add` / `update` / `close`), `size`, a stack of up to `limit` (3; the rest queue), `duration` 5000 ms that pauses on hover, focus and a hidden tab, and is 0 for a toast with an `action`, a visually hidden announcer (`priority`), and a viewport that moves into an open modal (`ModalFrame` registers its `<dialog>` as a toast host through `_shared/ToastHost`). Added `--color-toast-background` (an alias of the overlay recipe), extracted `_shared/usePresence` from `useOverlay`, and built `_shared/VisuallyHidden`. See [Toast](#toast) for what was and was not checked

**Navigation and disclosure:**

- [x] `Tabs` — Sibling: Radio (one of several, arrow-key roving, `orientation`), Menu for the focus. `items` (each with its `content`), required `value` / `onChange` (the parent owns the selection), `orientation`, `size`; APG tabs with automatic activation, only the selected panel mounted. Adds only `--color-tabs-*` aliases, and takes the overlay's frosted finish through `floatingClass`. See [Tabs](#tabs)
- [x] `Collapsible` — Sibling: Tabs (disclosure), Popover for the open state (uncontrolled unless `isOpen` is given), Select for the chevron. `title`, `icon`, `children`, `isOpen` / `defaultIsOpen` / `onOpenChange`, `isDisabled`, `size`; APG disclosure (a button with `aria-expanded` / `aria-controls`), the content stays mounted and animates its height. Adds only `--color-collapsible-background-hover`, and extracted `_shared/ChevronIcon` (and its shell `_shared/StrokeIcon`, shared with CheckIcon and CrossIcon) from Select. See [Collapsible](#collapsible)
- [ ] `Accordion` — Sibling: Collapsible (a group of them, one open at a time, arrow-key roving between headers); build it on Collapsible rather than beside it
- [x] `Link` — Sibling: Text (the type size) and Chip / Button (the focus ring). A real `<a href>`, `size` (unset: the surrounding text's), `isCurrent`, `isDisabled`; routing through one `LinkProvider` with `navigate` and `resolveHref`, whose logic is `_shared/useLinkProps` (a plain left click on an in-app link goes to the router; everything else is the browser's). Adds only `--color-link`, an alias of `--color-primary-strong`. See [Link](#link)
- [x] `Breadcrumb` — Sibling: Link (each item, and its routing), Tabs for the `items` shape and `size`, Collapsible for the turned chevron. `items` (`label`, optional `href`), `size`, `aria-label`; APG breadcrumb (`<nav>` + `<ol>`), the last item is the current page (`aria-current="page"`), a long trail wraps. Adds no token and no shared file. See [Breadcrumb](#breadcrumb). Still to do: collapsing the middle of a long trail, an item `icon`, a custom separator
- [x] `Pagination` — Sibling: Tabs (required, controlled `page`), Breadcrumb (the `<nav>` + `<ol>` shell, `size`, the turned chevron), Link for `useLinkProps`, Chip for the look. `page`, `pageCount`, `siblingCount`, `boundaryCount`, `isDisabled`, `size`, `labels`; buttons with `onChange`, or links with `getHref` (routed by a `LinkProvider`); a row of constant width with "…" gaps. Adds three alias tokens and no shared file. See [Pagination](#pagination). Still to do: a compact form, a gap that opens a menu, an item count

**Inputs still missing:**

- [x] `Slider` — Sibling: Toggle (a custom-drawn native input, the thumb's hover and press motion) and TextFieldFrame for label and error. A native `<input type="range">`: `min` / `max` / `step`, `value` / `defaultValue` / `onChange(number)`, `formatValue` (aria-valuetext), `label`, `error`, `isDisabled`, `size`; the fill is drawn from `--slider-value` as Progress's is. Adds only `--color-slider-*` aliases and no shared file (its one piece of repeated CSS, the WebKit and Firefox pseudo-element rules, is kept short with a `--thumb-transition` property). See [Slider](#slider). Still to do: a visible value, tick marks, a two-thumb range, vertical
- [x] `SegmentedControl` — Sibling: Radio (native radios in a `radiogroup`, controlled or uncontrolled), Tabs for the thumb and `size`. `options` (with an optional `icon`), `value` / `defaultValue` / `onChange`, `name`, `label`, `error`, `isDisabled`, `isRequired`, `size`; one value that applies at once (a quick filter, a view), not navigation (that is Tabs). Adds `--color-segmented-*` aliases of the field fill and the brand color, and extracted `_shared/OptionGroupFrame` (the third option group), `_shared/useChoice` and `_shared/SlidingThumb` (Tabs' thumb). See [SegmentedControl](#segmentedcontrol)
- [x] `NumberInput`, password reveal — variants of TextField, not new components: `type="number"` with `hasSteppers`, and `type="password"` with `isRevealable`. Sibling: Select (buttons inside a field). Adds `TextFieldFrame`'s `end` slot, extracts `_shared/IconButton` from `CloseButton`, and no token. See [TextField](#textfield). Still to do: a `labels` prop, press-and-hold repeat, a unit suffix
- [x] `FileUpload` — Sibling: Select and Slider (`TextFieldFrame` around a custom control), Progress / `CloseButton` / `OptionText` for the file rows. A drop zone over a native file input, and a list of the files. Form mode (files stay in the input and submit with the form) and upload mode (`uploadFile`, the consumer's function, called per picked file with a `signal` and `onProgress`; `onUploaded` gets its result; progress, done, error with Retry, removing aborts). `accept` / `maxSize` / `maxFiles` with `onReject`. Adds `--color-fileupload-*` aliases, `_shared/useControlledState` (extracted from `useChoice`) and `isDisabled` on `CloseButton`. See [FileUpload](#fileupload)
- [ ] The date and time family — the largest; last. Not one `DatePicker` with a `mode` prop: the four uses
      (a birthday, a date near today, a date and time, a range) want different interactions and value types, so
      they are small components over one `Calendar`. Values are local strings, never instants (see
      [Date and time values](#date-and-time-values)). Order:
  1. [x] `Calendar` — month grid, grid keyboard navigation, `min` / `max` / `isDateDisabled`, a header that jumps
         to a month or year grid; usable inline. New: the grid and the date math. Sibling: Pagination, whose cell
         recipe became `_shared/RoundControl.module.css` with this second consumer. Adds `--color-calendar-*`
         aliases, `_shared/dateValue` and `_shared/RoundControl`. See [Calendar](#calendar)
  2. [x] `DateField` — typed day / month / year segments in one field (locale order, auto-advance); the
         birthday case, with no popup. Sibling: TextField through `TextFieldFrame`. New: the segmented input
         (`DateField/segments.ts`). Adds two `--color-datefield-segment-*` tokens, and `labelId` from the frame. See [DateField](#datefield)
  3. [x] `DatePicker` — `DateField` + a calendar button in the frame's `end` slot (as the password reveal) +
         `Popover` and `Calendar`, with presets (Today, Tomorrow). Adds no token; `IconButton` takes a ref and the
         other button attributes, `Popover` a `className` and a `--popover-max-height` hook. See [DatePicker](#datepicker)
  4. `TimeField`, then `DateTimePicker` — typed `hh:mm`, and `step` adds a list of intervals (Select's
     `OptionList` and `useTypeahead`); the popup is the calendar with the time list beside it
  5. `DateRangePicker` — two `DateField`s in `OptionGroupFrame` + one `Calendar` + presets. The active
     endpoint is explicit and shown (focusing a field makes it active; a calendar click sets that endpoint
     only; with none set, start then end). A value that makes the range invalid sets the active endpoint,
     clears the other and moves to it, never swapping silently. Hover previews the range. Later: dragging
     the endpoints on the calendar

**Data display:**

- [x] `Table` — Sibling: Pagination (its partner: the parent passes one page of rows), Tabs (controlled state, the array shape), Placeholder for loading. Data-driven: `columns` (key, header, cell, align, width, isSortable, isRowHeader), `rows`, `getRowKey`, `caption` or an aria name, `emptyMessage`, `size`, `labels`; controlled sorting (`sort` / `onSortChange`, the parent sorts) and row selection (`selectedKeys` / `onSelectedKeysChange`, a header box for the rows shown, indeterminate). Adds `--color-table-*` aliases and a neutral `--color-line` (Divider now aliases it too), and extracted `_shared/CheckControl` from Checkbox. See [Table](#table)

**Later, only if asked for:** Stepper, Rating, Tree, Command palette, Carousel.

### Phase 4: Developer Experience

- [x] Storybook 10 configured (react-vite, docs + a11y addons, light/dark toolbar toggle)
- [ ] Stories for every component
- [ ] Vitest + React Testing Library setup
- [ ] Changesets for versioning
- [ ] CI/CD for npm publishing
- [ ] Documentation site (or Storybook docs)

### Phase 5: Polish

- [ ] TypeScript strict mode
- [ ] Bundle size analysis
- [ ] Accessibility audit
- [ ] Migration guide for consumers

---

## Key Principles Summary

1. **Three variants + escape hatch** — `less`/`normal`/`more` + any CSS value
2. **CSS Variables for theming** — Native, SSR-safe, framework-agnostic
3. **CSS Modules for variants** — Zero runtime, browser-resolved, DevTools-friendly
4. **Direct CSS property names** — `borderRadius`, `fontWeight`, `boxShadow`, `padding`, `margin`
5. **Semantic names only for compounds** — `size` (multi-property: fontSize + padding + gap)
6. **Primitives first** — `Box`, `Stack`, `Grid` cover 80% of custom component needs
7. **Export everything** — Tokens, hooks, utilities, types for consumer extensibility
8. **No lock-in** — Escape hatch works, consumers can eject to own CSS anytime
