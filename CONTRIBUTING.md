# Contributing

## Setup

```bash
pnpm install
pnpm storybook   # every component, with a light / dark toggle
```

## Before you open a pull request

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm check:dup   # fails if you add duplicated code; remove the duplication rather than raising the ceiling
```

## How components are built

Read [DESIGN.md](DESIGN.md), the section for the nearest existing component, before adding one. In short:

- Props are `less` / `normal` / `more` plus an escape hatch (`ScaleProp`), named after the CSS property they drive.
- Styles are CSS Modules reading CSS variables. Colors come from `src/theme/tokens.css`: a new component
  aliases a shared token rather than writing a new `color-mix()` recipe, and a fixed finish stays in the
  component's CSS module, not in a token.
- Anything two components do alike lives in `src/components/_shared/`. Reuse it before copying.
- Update DESIGN.md when a component's props, tokens or shared files change, and the README when what a
  user sees changes.

## Releasing

Releases use [Changesets](https://github.com/changesets/changesets).

1. With each user-visible change, run `pnpm changeset` and say what changed (patch, minor or major).
2. To release, on `main`: `pnpm version` (bumps `package.json`, writes `CHANGELOG.md`), review and commit.
3. `pnpm release` publishes to npm. `prepublishOnly` typechecks, tests and builds first.

Before the first release of a version, check what would ship:

```bash
pnpm build
npm pack --dry-run          # dist/, README, LICENSE, package.json
npx publint                 # package.json exports and types
```

and install the packed tarball in a scratch app to import it once from ESM and once from CommonJS.
