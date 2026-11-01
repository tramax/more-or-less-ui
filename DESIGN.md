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

### Color Tokens (Separate from Scale)

Deliberately minimal for now: **one brand color, an error color (`--color-danger`), a `background` scale per component that has one (Card, Button, Banner), one opaque brand tint (`--color-primary-tint`) that Button's `normal` and Banner's `normal` alias, the opposite of the current text color (`--color-text-inverse`, which Banner's glow aliases), one faint field fill (`--color-field-background*`) that TextField, Textarea, Checkbox, Radio, Toggle and Select alias** (Banner's `less` aliases it too), **and secondary text (`--color-text-less`, 70% of the text color) that the option descriptions and Select's empty message share with Text's `color` scale**. That scale is `--color-text-less` / `-normal` / `-more` (the last is the brand color toward the text color, for contrast). No palettes, no
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
own without repeating the expression; `src/theme/tokens.test.ts` enforces it.

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
nothing else. There is no `Heading`, `Paragraph` or `Label`: `<Text as="h2" size="more" fontWeight="more">`.

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
interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'color' | 'disabled' | 'readOnly' | 'required' | 'type'
> {
  size?: ScaleProp; // font-size on the root; padding and gaps are in em, so they follow
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
  label?: string; // visible, above the field; without it aria-label/aria-labelledby is required
  error?: string; // invalid state + message below the field; the caller decides when
  isDisabled?: boolean; // native `disabled`, dimmed
  isReadOnly?: boolean; // not editable, plain text: no fill, padding or focus border; tabIndex -1
  isRequired?: boolean; // native `required` + an aria-hidden asterisk after the label
}
```

`size` is the only scale prop: no `background`, no `borderRadius`. The field is a block of faint
color rather than a bordered box (easier to scan): `--color-textfield-background` is the brand
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

**Not yet:** hint text (probably alongside a Tooltip), adornments, `type="number"`. Multiline is a separate
component, `Textarea`, not a mode of this one.

TextField renders only the `<input>`. The frame around it (root, `size`, label, error message, id and
`aria-describedby` wiring) and the look of the field are `_shared/TextFieldFrame`, shared with Textarea;
`--color-textfield-*` are set as the `--field-*` hooks that module reads.
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
`className`/`style` on the root. Its tokens, `--color-textarea-*`, alias the shared field fill.

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
is `_shared/CrossIcon`, shared with the chip and Banner's dismiss button.

**Value.** Like Radio (`null` is the explicit empty value) for a single one, like Checkbox (`string[]`,
options order) for a multiple one. The user can't clear a single Select unless `isClearable`, which
reports `null`; otherwise clearing is the caller's (`value={null}`). `name` renders hidden inputs, since there is no native control: one for a single,
one per value for a multiple. Only values that are options count.

**Popup.** A `popover="manual"` element in the top layer, so no ancestor's `overflow` clips it and no
`z-index` is needed, placed with CSS anchor positioning: under the field, as wide as it, flipped above
when there is no room. It is rendered while open and for 200 ms after (see Motion), so it can animate
out. It stays a DOM child of the root, so `size` reaches it. Light dismiss is ours (blur, Escape), so focus never leaves the control, and a mousedown
in the popup is cancelled. Everything that knows it is a popover is in `Select/useSelectPopup.ts` and
the marked "Positioning" section of `Select.module.css`; changing how it is placed replaces those two
and nothing else. There is no fallback for a browser without the Popover API and anchor positioning.

**Motion.** The same organic principle as Button (springy on the way in, no overshoot on the way
out; `--ease-enter` / `--ease-leave` in `theme/tokens.css`):

- **The popup** grows out of the field: it starts at 0.94 scale and 0.5em toward the field (the other
  way when it flips above, from the bottom edge; `useSelectPopup` sets `data-side`), overshoots its
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
chevron that turns when open. The popup is an opaque `--color-select-popup` surface with
`--elevation-more`; the active option uses `--color-select-option-active`. A selected option in a
single Select has a tick after its text; in a multiple one each option is a Checkbox-style box with a
tick (`--color-select-check`), so selection is never color alone. A chip is the public
[Chip](#chip), removable, at the field's own size (`size="1em"`) and with the removable fill
(`--color-chip-background-removable`, the stronger field tint, over the field's own fill), with a
remove button (`aria-label="Remove <label>"`). A disabled option's chip, or any chip in a disabled
field, is `isDisabled`: dimmed, with no ×.

Shared with TextField and Textarea through `_shared/TextFieldFrame`: root, `size`, label, error, the
id / `aria-invalid` / `aria-describedby` wiring and the look of the control. The frame's focus border
also matches `:has(:focus-visible)`, so the multiple box shows it when its input is focused. The
option text is `_shared/OptionText`, and `SelectOption` is `OptionBase`. The list navigation
(`useListboxNavigation`) stays in `Select/` until a second component needs it. The chip was
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
- Check support for the Popover API and anchor positioning before release; the library already
  relies on `corner-shape` and `contrast-color()`.
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
not built). Called Banner, not Alert, because it announces rather than warns.

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

**Dismiss.** `onDismiss` renders a real `<button aria-label="Dismiss">` with `_shared/CrossIcon`, in
the tab order (unlike a Select chip's: a banner is not inside a field). On hover the × grows, as
Select's, over a faint disc of the text color (10%); when pressed the whole button shrinks (0.8,
quick, no overshoot), so the disc and the × go down together, and the disc deepens (20%). With `prefers-reduced-motion` only the disc remains. The hit area is 1.75em around a 1em ×. The Banner doesn't hide itself: the caller stops
rendering it and decides whether it comes back, so the state stays one place.

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
the brand color at 35% over transparent (more than Progress's 20% track only because a one-pixel line
needs more alpha than a filled bar to show). That is the one new color recipe; there was no faint line to alias
(`--color-text-less` is 70% of the text color, `--color-chip-border` the full brand color).

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
  placement?: 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'; // default 'top-end'; logical
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

**The mark.** A ring in `--color-indicator-ring` (default `Canvas`, 2px, drawn as a shadow so it adds no
size) cuts it out of what it overlaps; set it to the surface the content sits on. A dot is `0.625em`; a
count is `1.25em` tall with `0.3em` side padding and semicircular ends, its digits at `0.75em`, weight
`more`, tabular. It arrives with a 300ms scale from zero on `--ease-pop` (the gentle overshoot the library
uses for small marks) and leaves with a 180ms scale to zero on `--ease-leave`, which does not overshoot:
nothing grows on the way out. Both are off under `prefers-reduced-motion` through `styles.css`'s global rule. It
takes no pointer events, so a click lands on what it wraps. `size` sets the font-size of the **mark**
(`_shared/Size.module.css`), not the root, so a bigger indicator does not enlarge the wrapped text.

**Placement is two nested boxes, not a transform.** A zero-size anchor (`position: absolute`) sits on the
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

---

## Loading

There is no `Skeleton` component and no `isLoading` prop. Loading is the **state of a region**: set
`aria-busy="true"` on any element (a Stack, a Card, a Text) and the Text, Avatar and option text inside
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
import { Card, Text, ScaleProp, isVariant } from 'more-or-less-ui';

interface StatCardProps {
  value: string;
  label: string;
  size?: ScaleProp;
  borderRadius?: ScaleProp;
  boxShadow?: ScaleProp;
}

export function StatCard({ value, label, size, borderRadius, boxShadow }) {
  return (
    <Card
      padding="normal"
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      bg="bgPrimary"
      border
      borderColor="borderDefault"
    >
      <Text size={size} fontWeight="more" color="textPrimary">
        {value}
      </Text>
      <Text size="less" color="textMuted">
        {label}
      </Text>
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
│   │   ├── Select/
│   │   ├── _shared/        # Shared by several components (Gap: Stack + Grid; OptionGroup: Checkbox + Radio, and Toggle's control; TextFieldFrame: TextField + Textarea + Select; FieldError, FieldLabel, types: all fields; OptionText + OptionIcon: options, Button's icon and Chip's (OptionText also: Avatar's name and description); Placeholder: Text + Avatar + OptionText, the block they become inside aria-busy; Size.module.css: Spinner + Progress; Ring: Spinner + Progress's circle; CrossIcon: Select + Banner + Chip; CheckIcon: Checkbox + Toggle + Select + Chip)
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
export { Select } from './components/Select';

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
/* globals.css */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}

/* Or attribute-based: <html data-theme="dark"> */
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
- [ ] `VisuallyHidden`, `Portal` — utilities the overlays need
- [x] `Spinner` — size (unset: 1em, as big as the surrounding text), named by `aria-label` or hidden; moved out of `_shared/` (Button, Select use it)
- [ ] Overlay primitive in `_shared/` — positioning, outside-click and Escape dismissal, focus return. Extract it from `Select/useSelectPopup.ts` in the same change as the first overlay below (a second consumer appears; CLAUDE.md says extract then). Check the Popover API and anchor positioning support first, as Select's section notes

**Display and feedback** (no overlay, no state machine):

- [x] `Indicator` — the **dot or count** pinned to a corner of what it wraps (an unread "3", an online dot). count / max / isZeroShown / isHidden, placement (logical corners), overlap (`rectangle` / `circle`), size, label (decorative until named). Brand color, never red; the fill aliases `--color-primary-strong` (the plain primary is 2.1:1 on white). Avatar's status dot is `<Indicator overlap="circle">`
- [x] `Divider` — orientation (`horizontal` / `vertical`); a one-pixel `<hr>` in `--color-divider`, no margin (the layout's gap spaces it, as Card's); no scale props
- [x] `Progress` — shape (`bar` / `circle`), size, value / max (no value: indeterminate), named by `aria-label` or `aria-labelledby`; the indeterminate circle is Spinner
- [x] ~~`Skeleton`~~ — not a component: loading is `aria-busy` on a region, and Text, Avatar and `OptionText` become blocks (`_shared/Placeholder`; see Loading). A wrapper means a second layout to keep in step and heights to match by hand. Still open: Button, Chip, fields, a block for an image or chart
- [ ] `List` — rows of Avatar + OptionText; Sibling: Avatar with `isTextShown`

**Overlays** (build on the primitive above):

- [ ] `Tooltip` — **next**: Avatar's `isTextShown={false}` shows the name and description in one
- [ ] `Popover`
- [ ] `Menu` (dropdown) — Sibling: Select's list and options (`OptionText`, active-option token)
- [ ] `Dialog` (modal) and `Drawer` — focus trap; the native `<dialog>` may cover most of it
- [ ] `Toast` — Sibling: Banner (it is a Banner that floats and times out; Banner's section says so)

**Navigation and disclosure:**

- [ ] `Tabs` — Sibling: Radio (one of several, arrow-key roving, `orientation`)
- [ ] `Accordion` / `Collapsible`
- [ ] `Breadcrumb`, `Pagination`, `Link` (or `Text as="a"`)

**Inputs still missing:**

- [ ] `Slider` — Sibling: Toggle (a custom control on `OptionGroup` classes) and TextFieldFrame for label and error
- [ ] `SegmentedControl` / `ToggleGroup` — Sibling: Radio
- [ ] `NumberInput`, password reveal — variants of TextField, not new components (add to `TextFieldFrame` only what they share)
- [ ] `FileUpload`, `DatePicker` (and Calendar) — the largest; last

**Data display:** `Table` (Sibling: Grid, Card).

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
