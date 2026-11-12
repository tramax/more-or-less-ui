# More or Less UI

A React UI library built on **relative scaling** (`more`/`less`/`normal`) with CSS Variables for theming.

## Philosophy

**One mental model for everything:** Every sizing/styling prop accepts three intentional variants + an escape hatch.

```tsx
// Universal pattern
<Component />                    // normal (default)
<Component prop="more" />        // one step up
<Component prop="less" />        // one step down
<Component prop="1.5rem" />      // escape hatch: any CSS value
<Component prop={18} />          // escape hatch: number = pixels
```

No `sm`/`md`/`lg`/`xl`/`2xl` — just `more`/`less`/`normal`.

## Features

- **Relative Scale System** — `more`/`less`/`normal` across all props (size, radius, weight, spacing, elevation)
- **CSS Variables for Theming** — Native, SSR-safe, framework-agnostic
- **CSS Modules for Variants** — Zero runtime, browser-resolved, DevTools-friendly
- **Direct CSS Property Names** — `borderRadius`, `fontWeight`, `boxShadow`, `padding`, `margin`
- **Escape Hatch** — Any CSS value as string or number (pixels)
- **React ThemeProvider** — Optional programmatic theme switching with persistence
- **Tree-shakeable** — ESM/CJS dual package exports
- **TypeScript First** — Full type safety with `ScaleProp` type

## Installation

```bash
npm install more-or-less-ui
# or
pnpm add more-or-less-ui
# or
yarn add more-or-less-ui
```

## Quick Start

```tsx
import { Button, Stack, Text } from 'more-or-less-ui';
import 'more-or-less-ui/styles.css';

function App() {
  return (
    <Stack direction="row" gap="more" align="center">
      <Button size="more" borderRadius="more">
        Primary Action
      </Button>
      <Button size="less" boxShadow="less">
        Secondary
      </Button>
    </Stack>
  );
}
```

## Theming

### 1. CSS Variable Overrides (Global)

```css
/* Your globals.css */
@import 'more-or-less-ui/styles.css';

:root {
  --color-primary: #ec4899; /* Your brand color */
  --size-less: 0.75rem;
  --size-normal: 1rem;
  --size-more: 1.5rem;
  --radius-less: 0;
  --radius-normal: 0.5rem;
  --radius-more: 1rem;

  /* Fonts: one for all text, and optionally another for headings (Title) */
  --font-family-body: 'Inter', system-ui, sans-serif;
  --font-family-title: 'Fraunces', Georgia, serif;
}
```

The library loads no font files: load your fonts as usual (`@font-face`, a `<link>`), then name them
here. Set `--font-family-body` on `:root`; everything inherits it, titles included unless
`--font-family-title` is set.

### 2. Light/Dark Mode

```css
/* Class-based toggle: <html data-theme="dark"> sets color-scheme: dark and the dark overrides */

/* CSS-only: respects OS preference */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}
```

### 3. React ThemeProvider (Programmatic)

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

## Scale Props

Every component accepts these props with `ScaleProp` type (`'less' | 'normal' | 'more' | string | number | undefined`):

| Prop           | CSS Property                   | Description                   |
| -------------- | ------------------------------ | ----------------------------- |
| `size`         | `fontSize` + `padding` + `gap` | Compound: text size + spacing |
| `borderRadius` | `borderRadius`                 | Corner roundness              |
| `fontWeight`   | `fontWeight`                   | Text weight                   |
| `boxShadow`    | `boxShadow`                    | Elevation/depth               |
| `padding`      | `padding`                      | Internal spacing              |
| `margin`       | `margin`                       | External spacing              |

### Defaults

Components are opinionated: a prop you leave out falls back to `normal` where that makes a good starting point. `Card`, for example, defaults `padding`, `borderRadius`, `boxShadow` and `background` to `normal`, so a bare `<Card />` is already a styled surface. `Box` is the exception: it only adds the margin and padding you ask for. To opt out, pass an escape-hatch value such as `padding={0}` or `boxShadow="none"`. The per-side props (`paddingLeft`, `marginTop`, ...) have no default; they only override their shorthand.

To switch a default off, pass an escape-hatch value: `padding={0}`, or `background="less"` for a transparent background.

### Usage Examples

```tsx
// Standard variants (90% of cases)
<Button size="more" />
<Button borderRadius="less" />
<Button fontWeight="more" />
<Card padding="more" borderRadius="less" />
<Box padding="more" marginBottom="less" />

// Escape hatch (10% of cases)
<Button size="1.5rem" borderRadius="50%" fontWeight={700} />
<Box margin="2rem" padding="1rem 2rem" />
<Card borderRadius="50%" />
```

## Components

### Primitives (Building Blocks)

- `Box` — Margin and padding only, for layout
- `Card` — A surface: padding, borderRadius, boxShadow, background
- `Stack` — Flex layout: a column by default, `direction="row"` for a row; `gap`, `align`, `justify`, `wrap`
- `Grid` — Grid layout helper
- `Text` — Typography with size/weight/color
- `Title` — A heading (`h1`-`h6`) with its own size, weight and font tokens

### Components (Composed)

- `Button` — Interactive button with all scale props
- `Input` — Form input
- `Textarea` — Multi-line input
- `Slider` — Pick a number from a range
- `FileUpload` — Drop zone and file list; keep files in the form, or upload each one as it is picked
- `Select` — Compound select component

## Extensibility

Build custom components using the same design tokens:

```tsx
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
```

## Scripts

```bash
npm run dev        # Watch mode build
npm run build      # Production build
npm run typecheck  # TypeScript check
npm run test       # Run tests
npm run test:watch # Watch tests
npm run lint       # ESLint
npm run storybook  # Start Storybook
```

## Publishing

```bash
npm run changeset  # Create changeset
npm run version    # Version bump
npm run release    # Publish to npm
```

## License

MIT
