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
No `divider` prop; put a `Divider` between children.

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
  plain brand color is only 2.1:1 on white, so `more` mixes 30% of the text color into it: 5:1 or
  better on a light and a dark page. It says nothing about meaning (error, success); that is an
  escape-hatch value, `color="var(--color-danger)"`. Any other string is a CSS color, set inline.
- **`fontWeight` as a number is unitless** (`700`, not `700px`), unlike the other props, where a number
  is pixels.
- `as` is for what the text _is_. Elements that are interactive or belong to a form (`label`, `a`,
  `button`) are other components' job.

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
module (currently placeholders on the `normal` tokens).

Boolean props use the `is*` prefix. While `isLoading`, the content stays in the layout (transparent)
so the button keeps its width and its accessible name. The spinner is `_shared/Spinner`, also used by
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
(the whole chip is the hover target: it takes `--color-select-chip-hover` and the × scales up); its button is the accessible name and is out of the tab order, so
the field is one Tab stop.

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

`isLoading` is independent of it and works on any Select. The field shows `_shared/Spinner` (the ring
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
tick (`--color-select-check`), so selection is never color alone. A chip is a `--color-select-chip` pill
(`--color-select-chip-hover` on hover) with a remove button (`aria-label="Remove <label>"`).

Shared with TextField and Textarea through `_shared/TextFieldFrame`: root, `size`, label, error, the
id / `aria-invalid` / `aria-describedby` wiring and the look of the control. The frame's focus border
also matches `:has(:focus-visible)`, so the multiple box shows it when its input is focused. The
option text is `_shared/OptionText`, and `SelectOption` is `OptionBase`. The list navigation
(`useListboxNavigation`) and `SelectChip` stay in `Select/` until a second component needs them; the
chip becomes the shared Badge when that is built.

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
│   │   ├── Banner/
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
│   │   ├── _shared/        # Shared by several components (Gap: Stack + Grid; OptionGroup: Checkbox + Radio, and Toggle's control; TextFieldFrame: TextField + Textarea + Select; FieldError, FieldLabel, types: all fields; OptionText + OptionIcon: options, and Button's icon; Spinner: Button + Select; CrossIcon: Select + Banner)
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
- [ ] `Badge`, `Icon` — Display
- [x] `Card` — the former Box: radius, shadow, background, padding (no margin); renders a Box. Still to add: slots, interactive variant, semantic element

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
