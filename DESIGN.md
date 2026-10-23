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
| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Build Tool** | `tsup` | Zero-config, dual ESM/CJS, fast (esbuild), built-in `--dts` |
| **Package Manager** | `pnpm` | Disk-efficient, fast, strict dependency resolution |
| **Testing** | `Vitest` + React Testing Library | Native ESM, TypeScript, shares config with Vite/tsup |
| **Component Explorer** | **Storybook** | Mature ecosystem, Chromatic integration, team familiarity |
| **Styling** | **CSS Modules + CSS Variables** | Zero runtime, native theming, SSR-safe, escape hatch via inline styles |
| **CSS Modules naming** | `*.module.css` | Required for Vite (Storybook/Vitest) and esbuild (tsup) to treat a file as a CSS Module. tsup emits component CSS into `dist/styles.css` (single consumer import) via a small plugin in `tsup.config.ts` |
| **Publishing** | Public npm + Changesets | Standard versioning, automated releases |

### Theming System
| Decision | Choice |
|----------|--------|
| **Mechanism** | CSS Variables (native) |
| **Theme Switching** | Both: CSS-first (`[data-theme]`) + optional React `ThemeProvider` |
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
  --size-less: 0.875rem;    /* 14px */
  --size-normal: 1rem;      /* 16px */
  --size-more: 1.25rem;     /* 20px */

  /* Radius scale */
  --radius-less: 0.5rem;    /* 8px */
  --radius-normal: 1.25rem; /* 20px */
  --radius-more: 2rem;      /* 32px */

  /* Weight scale */
  --weight-less: 300;
  --weight-normal: 400;
  --weight-more: 600;

  /* Spacing scale */
  --space-less: 0.5rem;     /* 8px */
  --space-normal: 1rem;     /* 16px */
  --space-more: 1.5rem;     /* 24px */

  /* Elevation scale */
  --elevation-less: 0 1px 2px rgb(0 0 0 / 0.05);
  --elevation-normal: 0 4px 6px rgb(0 0 0 / 0.07);
  --elevation-more: 0 10px 15px rgb(0 0 0 / 0.1);
}

```

### Color Tokens (Separate from Scale)

Deliberately minimal for now: **one brand color, an error color (`--color-danger`), a `background` scale per component that has one (Box, Button), and one faint field fill (`--color-field-background*`) that TextField, Checkbox and Radio alias**. No palettes, no
numbered shades (50-900), no primary/secondary families. More colors get added when a component
actually needs one.

```css
/* theme/tokens.css (alongside the scale tokens) */
:root {
  --color-primary: #3b82f6;

  /* Box's `background` less / normal / more */
  --color-box-background-less: transparent;
  --color-box-background-normal: Canvas; /* system canvas: white in light, system dark in dark */
  --color-box-background-more: #d9c9ad; /* sand */

  /* Button's `background`, separate so each component can be customised on its own */
  --color-button-background-less: transparent;
  --color-button-background-normal: color-mix(in oklab, var(--color-primary) 40%, Canvas);
  --color-button-background-more: #d9c9ad; /* sand */
}

/* theme/themes.css */
[data-theme="dark"] {
  color-scheme: dark; /* flips system colors: Canvas, CanvasText, form controls, scrollbars */
  --color-box-background-more: #4a3f33; /* umber */
  --color-button-background-more: #4a3f33; /* umber */
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

| Prop Name | CSS Property | Type |
|-----------|--------------|------|
| `borderRadius` | `border-radius` | `ScaleProp` |
| `fontWeight` | `font-weight` | `ScaleProp` |
| `boxShadow` | `box-shadow` | `ScaleProp` |
| `padding` | `padding` | `ScaleProp` |
| `paddingLeft` | `padding-left` | `ScaleProp` |
| `paddingRight` | `padding-right` | `ScaleProp` |
| `paddingTop` | `padding-top` | `ScaleProp` |
| `paddingBottom` | `padding-bottom` | `ScaleProp` |
| `margin` | `margin` | `ScaleProp` |
| `marginLeft` | `margin-left` | `ScaleProp` |
| `marginRight` | `margin-right` | `ScaleProp` |
| `marginTop` | `margin-top` | `ScaleProp` |
| `marginBottom` | `margin-bottom` | `ScaleProp` |

### Semantic/Compound Props (Multiple CSS Properties)

| Prop Name | Affects | Type |
|-----------|---------|------|
| `size` | `fontSize` + `padding` + `gap` | `ScaleProp` |

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

.borderRadiusLess { border-radius: var(--radius-less); }
.borderRadiusMore { border-radius: var(--radius-more); }

.fontWeightLess { font-weight: var(--weight-less); }
.fontWeightMore { font-weight: var(--weight-more); }

.boxShadowLess { box-shadow: var(--elevation-less); }
.boxShadowMore { box-shadow: var(--elevation-more); }

.paddingLess { padding: calc(var(--space-less) * 0.5) var(--space-less); }
.paddingMore { padding: calc(var(--space-more) * 0.5) var(--space-more); }
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
    const cssProp = prop;  // Direct mapping: prop name = CSS property name
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
      getInlineStyle('fontSize', size),     // size escape → fontSize
      getInlineStyle('padding', size),      // size escape → padding
      getInlineStyle('gap', size),          // size escape → gap
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
  }
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

<Box 
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

<Box
  borderRadius="12px"
  padding="1rem 2rem"
/>
```

---

## Primitive Components

### Box — The Fundamental Building Block

```tsx
// components/Box/Box.tsx
interface BoxProps {
  // Spacing (direct CSS mappings)
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

  // Radius, Shadow (direct)
  borderRadius?: ScaleProp;
  boxShadow?: ScaleProp;

  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
```

### Flex, Stack, Grid — Composition Helpers

```tsx
// components/Flex/Flex.tsx
interface FlexProps extends BoxProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  align?: 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline';
  justify?: 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: ScaleProp;
}

// components/Stack/Stack.tsx
interface StackProps extends BoxProps {
  direction?: 'vertical' | 'horizontal';
  divider?: React.ReactNode;
}

// components/Grid/Grid.tsx
interface GridProps extends BoxProps {
  columns?: number | ScaleProp;      // Can use ScaleProp for escape hatch
  rows?: number | ScaleProp;
  gap?: ScaleProp;
}
```

---

## Higher-Level Components

### Button
```tsx
interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'disabled'> {
  // Scale props (all optional, default = normal)
  size?: ScaleProp;              // font-size; padding and gap are in em, so they follow it
  background?: ScaleProp;        // --color-button-background-* tokens; normal is the primary color mixed with Canvas

  isDisabled?: boolean;          // native `disabled`: not clickable, not focusable
  isLoading?: boolean;           // spinner + aria-busy + aria-disabled; ignores clicks, stays focusable
  type?: 'button' | 'submit' | 'reset';  // defaults to 'button'
  onClick?: MouseEventHandler<HTMLButtonElement>;
}
```

No `variant` and no `color` prop: every prop has exactly three predefined values plus the escape
hatch. `background="more"` is the brand-colored button, `background="less"` the transparent one.

Border radius, font weight and box shadow are not props: the Button defines them itself in its CSS
module (currently placeholders on the `normal` tokens).

Boolean props use the `is*` prefix. While `isLoading`, the content stays in the layout (transparent)
so the button keeps its width and its accessible name.

### Card
```tsx
interface CardProps {
  size?: ScaleProp;              // Affects internal padding, font sizes
  borderRadius?: ScaleProp;
  boxShadow?: ScaleProp;
  padding?: ScaleProp;           // Content padding
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
interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>,
  'size' | 'color' | 'disabled' | 'readOnly' | 'required' | 'type'> {
  size?: ScaleProp;              // font-size on the root; padding and gaps are in em, so they follow
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
  label?: string;                // visible, above the field; without it aria-label/aria-labelledby is required
  error?: string;                // invalid state + message below the field; the caller decides when
  isDisabled?: boolean;          // native `disabled`, dimmed
  isReadOnly?: boolean;          // focusable, not editable, no fill
  isRequired?: boolean;          // native `required` + an aria-hidden asterisk after the label
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

**Not yet:** hint text (probably alongside a Tooltip), adornments, multiline (`Textarea`), `type="number"`.
**Open:** a borderless faint fill may not meet WCAG 1.4.11 (3:1 for the control's boundary); check it
in Storybook, and add a stronger bottom edge if it needs one.

### Checkbox
```tsx
interface CheckboxOption {
  value: string;
  label: string;
  description?: string;          // second line, linked with aria-describedby
  isDisabled?: boolean;          // native `disabled` on that option
}

interface CheckboxProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'disabled' | 'name' | 'defaultValue' | 'color'> {
  options: CheckboxOption[];
  value?: string[];              // controlled
  defaultValue?: string[];       // uncontrolled
  onChange?: (value: string[]) => void;  // values in `options` order, not click order
  name?: string;                 // each checked input is submitted under it
  orientation?: 'horizontal' | 'vertical';  // defaults to 'vertical'
  minChecked?: number;
  maxChecked?: number;
  label?: string;                // the <legend>; without it aria-label/aria-labelledby is required
  error?: string;                // invalid state + message below the group; the caller decides when
  isDisabled?: boolean;          // every option disabled, group dimmed
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

**Open:** the raised-hover CSS is still a copy of Button's motion (as `--option-*` variables). The hover
scale and shadow strength want tuning in Storybook.

### Radio
```tsx
interface RadioOption {
  value: string;
  label: string;
  description?: string;          // second line, linked with aria-describedby
  isDisabled?: boolean;          // native `disabled` on that option
}

interface RadioProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'disabled' | 'name' | 'defaultValue' | 'color' | 'role'> {
  options: RadioOption[];
  value?: string | null;         // controlled; null = controlled with nothing selected
  defaultValue?: string;         // uncontrolled
  onChange?: (value: string) => void;
  name?: string;                 // shared by the inputs; generated when left out
  orientation?: 'horizontal' | 'vertical';  // defaults to 'vertical'
  label?: string;                // the <legend>; without it aria-label/aria-labelledby is required
  error?: string;                // invalid state + message below the group; the caller decides when
  isDisabled?: boolean;          // every option disabled, group dimmed
  isRequired?: boolean;          // native `required` on the inputs + an aria-hidden asterisk after the label
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

### Textarea, Select
Not built yet. `Textarea` should share TextField's look and label/error wiring.

---

## Theme Provider (Optional React API)

```tsx
// theme/ThemeProvider.tsx
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;           // localStorage key
  enableSystem?: boolean;        // Watch prefers-color-scheme
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
import { Box, Text, ScaleProp, isVariant } from 'more-or-less-ui';

interface StatCardProps {
  value: string;
  label: string;
  size?: ScaleProp;
  borderRadius?: ScaleProp;
  boxShadow?: ScaleProp;
}

export function StatCard({ value, label, size, borderRadius, boxShadow }) {
  return (
    <Box
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
    </Box>
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
│   │   ├── Box/
│   │   │   ├── Box.tsx
│   │   │   ├── Box.module.css
│   │   │   ├── Box.stories.tsx
│   │   │   └── index.ts
│   │   ├── Button/
│   │   ├── Flex/
│   │   ├── Stack/
│   │   ├── Grid/
│   │   ├── Text/
│   │   ├── Card/
│   │   ├── TextField/
│   │   ├── Textarea/
│   │   ├── Select/
│   │   ├── _shared/        # Shared by several components (OptionGroup: Checkbox + Radio; FieldError, types: all fields; OptionText: options)
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
export { Flex } from './components/Flex';
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
    <select value={theme} onChange={e => setTheme(e.target.value)}>
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
    children: 'Custom' 
  } 
};
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] `types/scale.ts` — `ScaleProp`, `Variant`, `isVariant`
- [ ] `theme/tokens.css` — 15 scale CSS variables
- [x] Color tokens in `theme/tokens.css` — Minimal: one primary color + Box and Button background scales
- [ ] `theme/themes.css` — Light/dark theme definitions
- [ ] `theme/ThemeProvider.tsx` + `useTheme` hook
- [ ] `utils/cssVars.ts` — `getCSSVariable`, `getAllTokens`
- [ ] `src/styles.css` — Global entry point

### Phase 2: Primitives
- [ ] `Box` — Full `ScaleProp` support on all props
- [ ] `Flex` — Layout helpers
- [ ] `Stack` — Vertical/horizontal with divider
- [ ] `Grid` — Column/row helpers
- [ ] `Text` — Typography with `size`, `weight`, `color` props

### Phase 3: Components
- [x] `Button` — size, background, isDisabled, isLoading
- [x] `TextField` — size, label, error, isDisabled, isReadOnly, isRequired
- [x] `Checkbox` — options, orientation, minChecked/maxChecked, label, error, isDisabled (no `size`)
- [x] `Radio` — options, orientation, label, error, isDisabled, isRequired (no `size`); shares `_shared/OptionGroup` with Checkbox
- [ ] `Select` — Compound component pattern
- [ ] `Textarea`, `Toggle` — Form controls
- [ ] `Badge`, `Alert`, `Icon` — Display
- [ ] `Card` — Only once it adds more than Box (slots, interactive variant, semantic element)

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
6. **Primitives first** — `Box`, `Flex`, `Stack` cover 80% of custom component needs
7. **Export everything** — Tokens, hooks, utilities, types for consumer extensibility
8. **No lock-in** — Escape hatch works, consumers can eject to own CSS anytime