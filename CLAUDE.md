# more-or-less-ui

React UI library: `less` / `normal` / `more` scale props, CSS Modules + CSS variables. The design
spec is [DESIGN.md](DESIGN.md); read the section for the nearest existing component before building.

## Commands

`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:dup`, `pnpm storybook`.

## Reuse before you copy

The input components (TextField, Checkbox, Radio, and whatever comes next) are meant to look and
behave alike. Write the second one so the third is free.

Before adding a component, token, or more than a few lines of CSS/TSX, do this and say the result in
your plan or reply:

1. **Name the closest existing sibling** and what it already provides (tokens, `_shared/` CSS, error
   message, label/legend wiring, id handling, controlled/uncontrolled state).
2. **List what is shared and what really differs.** Reuse the shared part; only the difference is new.
3. **If you copy anyway, give the reason** in a comment where it is copied. "So each can be customised
   on its own" is not a reason to repeat a recipe; see Tokens.

When a second consumer appears for something that so far had one, extract it in the same change.
Don't leave "same as X" comments as the plan.

### Tokens

`src/theme/tokens.css` defines a color recipe once, as a shared token (`--color-field-background*`,
`--color-on-primary`). A component token aliases it: `--color-radio-background: var(--color-field-background)`.
That keeps each component customisable without repeating the `color-mix()` / `oklch()` expression.
A new input component adds its aliases, not a new recipe. `src/theme/tokens.test.ts` fails if the
same recipe is defined under two names.

### Shared code

- `components/_shared/` holds CSS shared by several components (`OptionGroup`: Checkbox + Radio).
- Components set `--option-*` style hooks on their root from their own tokens, and shape only their control.
- `_shared/TextFieldFrame` is the frame of a single-control field (TextField, Textarea, Select, Slider, FileUpload): root, `size`,
  label, error message, and the id / `aria-invalid` / `aria-describedby` wiring. A component passes it
  its props and renders only its control (`<input>`, `<textarea>`) from what the frame hands back; it
  sets the `--field-*` color hooks from its own tokens on its root class.
  Slider ignores the `className` it hands back (a text field's filled box) and draws its own control;
  FileUpload puts it on its drop zone, a box that holds the focused input, as Select's box of chips does.
  Its `end` slot (with `endCount`) puts `IconButton`s inside the field at the inline end and leaves the control
  room for them; TextField's password reveal and number steppers use it.
- `_shared/FieldError` is the error message + icon for every field and group. Pass spacing through
  `className`; a new input component renders it rather than its own `<p>` and `<svg>`.
- `_shared/FieldLabel` is the visible name (a `<label>` for TextField, a `<legend>` for groups) with
  its required asterisk. Spacing goes through `className`.
- `_shared/OptionList.module.css` is the surface and rows of a list of options in an overlay (Select's
  popup, Menu's panel); the component sets `--list-background` and `--list-active` from its own tokens.
  `_shared/optionNavigation` is `stepEnabled`, `findByPrefix` and `useTypeahead` for the keyboard.
- `_shared/useOverlay` + `Overlay.module.css` + `Overlay.ts` are every overlay (Select's popup, Tooltip,
  Popover, Menu, and Dialog and Drawer through `isModal`; Toast and Tabs (the tray) take only the CSS, through `floatingClass`); `_shared/useTriggerRef` is the trigger clone's ref and `TriggerProps`. `_shared/useScrollLock` stops the page scrolling under a modal (Dialog).
- `_shared/ModalFrame` is every modal (Dialog, Drawer): the `<dialog>`, trigger, backdrop press, scroll
  lock, header, actions, and `ModalProps`. A modal passes it `className` (the overlay classes from
  `Overlay.ts`, its size and placement, and `--modal-background` / `--modal-backdrop` from its own
  tokens) and `contentClassName`, and writes only where it sits and how big it is.
- `_shared/usePresence` is how long a thing stays mounted after it closes, to animate out (`useOverlay`,
  and each toast). `_shared/ToastHost` is how a modal tells `ToastProvider` "show toasts in me": the page
  behind a modal `<dialog>` is inert, so a toast beside it can't be pressed. `ModalFrame` does it, so a new
  modal built on it needs nothing; a new modal that is not built on it must call `useToastHost`.
- `_shared/VisuallyHidden` is text for screen readers only (Toast's live regions); not exported.
- `_shared/CheckIcon`, `_shared/CrossIcon` and `_shared/ChevronIcon` are the ✓, × and ⌄ (Select's field,
  Collapsible's header), drawn with attributes on the shell of `_shared/StrokeIcon`; a consumer's
  class sets only size, color and motion.
- `_shared/CheckControl` is the checkbox's box and tick (a native input, the brand fill, the tick that draws in,
  and a dash for `isIndeterminate`), used by Checkbox's options and Table's row selection. Its tick color is
  `--color-checkbox-check` for every caller; the label and row around it are the caller's.
- `_shared/IconButton` is the round icon button (disc on hover, shrink on press): the consumer passes `label`,
  `icon` (a component taking `className`), `onClick` and spacing through `className`. `_shared/CloseButton` is
  it with the ×, for Banner's and Toast's dismiss and Dialog's close; TextField's reveal and steppers use it.
- `_shared/Gap` is the `gap` scale (classes + `resolveGap`) for Stack and Grid, which both render a Box
  for padding and margin. A new layout component takes `gap` from it rather than its own classes.
- `_shared/OptionGroupFrame` is the frame of a group of options (Checkbox, Radio, SegmentedControl): the
  fieldset, legend, error message and the `aria-describedby` wiring. It hands its children `rootId` and
  `hasError`; a component renders only its controls and sets the look of its root through `className`.
  `_shared/useControlledState` is "controlled by `value`, or kept from `defaultValue`" (useChoice, FileUpload).
  `_shared/useChoice` is the one-of-several state (Radio, SegmentedControl): controlled by `value`,
  or kept from `defaultValue`.
- `_shared/SlidingThumb` is the thumb that slides to the selected option (Tabs, SegmentedControl):
  `useSlidingThumb` measures the option's element and `SlidingThumb` draws it; the component's class gives
  its fill, radius and shadow.
- `_shared/OptionText` is the label + description beside an option's control; `_shared/types.ts` has
  `NameProps` (the accessible-name union for every labelled input) and `OptionBase` (one option).
- `_shared/Size.module.css` is the `size` scale as font-size. A component whose only scale prop is
  `size` (Spinner, Progress, Toast, Tabs) passes it to `resolveScaleProps` instead of copying the classes.
- `_shared/Ring` is the ring's drawing (viewBox, radius, stroke width, `pathLength` 100) for Spinner's
  arc and Progress's track and arc. A new circular mark takes it rather than its own SVG numbers.
- `_shared/Placeholder` is what text and pictures look like inside `aria-busy="true"`: the one recipe
  for loading (there is no `Skeleton` component or `isLoading` prop). A component puts
  `placeholder.placeholder` on the part that becomes a block and has nothing else to write. A new
  component that shows text or a picture does the same, rather than its own loading styles.
- Left duplicated on purpose (`pnpm check:dup` reports them):
  - The option row in Checkbox and Radio (label, control, `OptionText`): about 15 lines of markup that
    differ only in the input's `type`, its `checked` logic and the mark. Extracting it needs a
    `renderControl` callback that hides each input in another file; SegmentedControl, the third group, does not
    use the row, so only two components would use it. Until then, keep the two in step.
  - The `size*` classes in Button, Banner, Avatar, Chip, Text and `_shared/TextFieldFrame`, which `resolveScaleProps` looks up in
    each component's own CSS module. They could take `size` from `_shared/Size.module.css` by passing
    `{ ...sizes, ...styles }` to it; that is not done yet.

## Before you finish

Run `pnpm test`, `pnpm typecheck`, `pnpm lint` and `pnpm check:dup`. `check:dup` has a ceiling set at
the current level, 0.8% (`.jscpd.json`, clones under 10 lines are ignored); if you add duplication it fails. Remove the duplication rather than
raising the ceiling. Lower the ceiling when you remove some. Note that `jscpd` can't see the same
value under different names, which is what the tokens test is for.

Update DESIGN.md when a component's props, tokens or shared files change.
