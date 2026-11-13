# Site outline: the case for more-or-less-ui

A working document. It decides what the demo site says and in what order, and it is the source for the
LinkedIn series. Edit it freely; the site's content follows it. The reasoning is drawn from
[DESIGN.md](../DESIGN.md), the source of truth for how each component behaves. A claim here is only as good
as the code: verify each card against the component before it goes live.

## Thesis

> Every default here is a decision about a person using the interface, and each one can be argued,
> tried and criticised.

Storybook answers "how do I use it?". The site answers "why is it like this?".

## How content stays in sync

- Every principle and component has a **slug** (`affordance`, `button`). The slug is its permalink on the
  site (`#/principles/affordance`) and its key in the LinkedIn series.
- **Status** is one of `outline` (idea only), `draft` (written, not checked against the code),
  `reviewed` (checked by the author), `live` (on the site).
- When a card changes here, change the site's card with the same slug, and the other way round.
- Planned additions (part 3) are private notes and are not shown on the site. When one ships, its entry moves to part 2.

## The card

Every principle and component uses the same five parts, so the page reads as reasoning and not as marketing.

1. **The issue with the existing convention:** what most libraries do, and what goes wrong with it.
2. **Our choice:** one sentence.
3. **Why:** the user need, with the source (NN/g, GOV.UK, APG, WCAG, ...).
4. **Example:** a live demo you can use, ideally the convention beside the choice.
5. **What it costs:** the trade-off we accepted. This is what makes an argument credible.

## Part 1: Principles

| #   | Slug                  | Principle                            | The decision                                                                                                                                                                                                                                                                                                             | Evidence in the repo                                                                                                               | Status |
| --- | --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `one-scale`           | One scale, no `sm/md/lg/xl`          | `less / normal / more` plus an escape hatch (`"1.5rem"`, `18`)                                                                                                                                                                                                                                                           | Title's sizes are ratios: "16 to 18px shows; 40 to 42px doesn't"                                                                   | draft  |
| 2   | `intensity-not-kind`  | No variants: color is a scale too    | No `variant` prop, and no color named for a meaning (primary, danger, success). Color props exist (`background` on Button, Card and Banner; `color` on Text and Title) but take the same three words: how much it stands out, never what it means. Radius, weight and shadow aren't props: the component owns its finish | Banner: `background` is intensity, not severity. Text: `color` says nothing about meaning; for that, pass a CSS color              | draft  |
| 3   | `affordance`          | Looks like how it behaves            | A control looks like what it does: a fill says you can press it, an outline says it is information, and things that do the same job behave the same way                                                                                                                                                                  | Chip ("an outline is information, a fill is something you can press"), Collapsible, Calendar, Toggle, TextField                    | draft  |
| 4   | `names-in-types`      | Accessible names enforced by type    | An icon-only Button without `aria-label` is a type error; a Dialog needs a title or a label                                                                                                                                                                                                                              | Button, Dialog, `NameProps`                                                                                                        | draft  |
| 5   | `native-first`        | Native elements first                | `<dialog>`, `<fieldset>`, `<input type=range>`, the Popover API, `role=switch`                                                                                                                                                                                                                                           | Dialog, Toggle, Slider                                                                                                             | draft  |
| 6   | `forms-by-research`   | Forms follow the research            | Visible label above, no placeholder-as-label, a specific error below, validate on blur, the caller decides when                                                                                                                                                                                                          | TextField (NN/g, GOV.UK)                                                                                                           | draft  |
| 7   | `motion-with-purpose` | Motion with a purpose                | Springy on enter, no overshoot on leave, three easing curves, `prefers-reduced-motion` respected                                                                                                                                                                                                                         | `--ease-enter / --ease-leave / --ease-pop`                                                                                         | draft  |
| 8   | `derived-color`       | One brand color; the rest is derived | Pick one brand color. The fills, tints, shadows, focus ring and the text on them are all derived from it in CSS, so they share a hue by construction, and re-skinning is changing one value                                                                                                                              | `tokens.css`: `--color-primary-tint`, `--color-primary-strong`, `--color-field-background`, `--color-on-primary`, `--shadow-color` | draft  |
| 9   | `loading-is-state`    | Loading is the state of a region     | `aria-busy` on any element. No Skeleton, no `isLoading`                                                                                                                                                                                                                                                                  | `_shared/Placeholder`                                                                                                              | draft  |
| 10  | `one-frame`           | Consistency by construction          | Six fields share one frame, so they can't drift apart                                                                                                                                                                                                                                                                    | `TextFieldFrame`, `OptionGroupFrame`                                                                                               | draft  |

## Part 2: Component decisions

Slug is the lowercase component name. Status is `outline` for all until each card is written. "Grounded"
means the reasoning is already written down in DESIGN.md; "to read" means only a one-line decision is known
and the section must be read before the card is drafted.

### Layout and surfaces

| Slug                   | Decision                                                                                               | Source   |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| `box`, `stack`, `grid` | Spacing and gap come from one scale. No `divider` prop; a `Divider` is a child                         | grounded |
| `card`                 | No margin props. The space around a card comes from the layout it sits in                              | grounded |
| `divider`              | No margin of its own; the layout's gap spaces it                                                       | grounded |
| `text`                 | Margins reset. The size scale stops at body text; display text uses an escape hatch                    | grounded |
| `title`                | The heading level (`as`) and the look (`size`) are chosen apart. Headings only; a big number is a Text | grounded |

### Actions

| Slug     | Decision                                                                                                                                            | Source   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `button` | `background` means intensity (filled, tinted, quiet). `isLoading` keeps the width, the name and the focus. Its shadow is the shared elevation scale | grounded |
| `link`   | `LinkProvider` hands navigation to your router; a plain click never bypasses it                                                                     | to read  |
| `menu`   | Actions (the menu closes when you choose). Select is for values                                                                                     | grounded |

### Inputs

| Slug                                  | Decision                                                                                                                                         | Source   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `textfield`                           | A block of faint color instead of a bordered box, which is easier to scan. The ⓘ tooltip sits beside the label, so the field's name stays "Name" | grounded |
| `textarea`, `select`, `slider`        | Same frame, label, error and ids as TextField. Select's popup never takes focus out of the control                                               | to read  |
| `checkbox`, `radio`                   | No scale props; they follow the font size (`em`). A group is a `fieldset` with a legend                                                          | grounded |
| `toggle`                              | A single boolean on purpose. No `error` or `isRequired`, because a switch is never "wrong"                                                       | grounded |
| `segmentedcontrol`                    | Radio semantics with a sliding thumb; the same state hook as Radio                                                                               | to read  |
| `fileupload`                          | The caller decides when it is an error. An aborted upload never reports                                                                          | to read  |
| `datefield`, `calendar`, `datepicker` | Typed segments in the locale's order. Local-date strings only. Presets are computed at render                                                    | to read  |
| `chip`                                | One of three, never mixed: static, removable or selectable. Selected shows a tick                                                                | grounded |

### Content and feedback

| Slug                  | Decision                                                                                                                      | Source   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| `avatar`              | No `background` prop. The color is a function of the name, so one person is one color everywhere                              | grounded |
| `banner`              | Named for what it does (announces), not Alert. `background` is intensity, not severity. Validation errors stay on the field   | grounded |
| `indicator`           | Not red, on purpose. The fill is a darker brand tint that clears 3:1 contrast                                                 | grounded |
| `toast`               | A queue of at most 3. The timer pauses on hover, on focus and in a hidden tab. A toast with an action does not time out       | grounded |
| `spinner`, `progress` | No visible `label` prop; it would only repeat `aria-label`                                                                    | grounded |
| `table`               | Columns declare their cells and the table never reads the row. `getRowKey` must be stable. Rows are this page, already sorted | to read  |

### Navigation and overlays

| Slug               | Decision                                                                                                        | Source   |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | -------- |
| `dialog`, `drawer` | Named for the platform (`<dialog>`). A title is required. Backdrop dismissal is opt-in                          | grounded |
| `tooltip`          | It describes, never names. Hoverable per WCAG 1.4.13. It clones the trigger and adds no wrapper element         | grounded |
| `popover`          | Built on the same overlay as Tooltip, Menu and Select                                                           | to read  |
| `tabs`             | Always controlled, and the tabs are data, not children, so the keyboard model can't be broken by custom content | grounded |
| `collapsible`      | One piece of content with a header. Not Tabs, and not an accordion                                              | grounded |
| `breadcrumb`       | A `nav` with an ordered list. The last item is the current page, so there is no `isCurrent` prop                | grounded |
| `pagination`       | Needs a link target or a handler, and the type enforces that                                                    | to read  |

## Part 3: Planned additions (private, not on the site)

Notes for the author only. Nothing here is mentioned on the site or in the posts until it ships. Each item
says what it builds on and what it waits for. Items marked **author** are the author's additions and are
not in DESIGN.md yet.

| Slug             | What                                                                  | Builds on (closest sibling)           | Waits for / open question                                                                                                                                                                                                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chip-color`     | **Colored chips** (status colors: success, error, warning)            | Chip                                  | Principle 8 (`derived-color`) says there is one brand color and deliberately no status palette, and principle 3 (`affordance`) says state is shown by form (a tick, an icon, a position), not by color alone. When it ships, its card has to say how a colored chip honours both (icon plus label, a small fixed set, contrast checked). **Decision needed from the author.** |
| `navbar`         | **A navigation bar** (author)                                         | Link, Menu, Tabs, Breadcrumb          | Not in DESIGN.md. Needs its closest sibling named, and a decision on how it collapses on a narrow screen (an overflow Menu, which Tabs also lacks)                                                                                                                                                                                                                            |
| `accordion`      | A group of Collapsibles, one open at a time, with arrow-key roving    | Collapsible                           | Listed as pending in DESIGN.md; build on Collapsible, not beside it                                                                                                                                                                                                                                                                                                           |
| `list`           | Rows of Avatar and text                                               | Avatar with `isTextShown`             | Listed as pending                                                                                                                                                                                                                                                                                                                                                             |
| `time-fields`    | `TimeField` and `DateTimePicker`                                      | DateField, Select's option list       | Listed as pending                                                                                                                                                                                                                                                                                                                                                             |
| `date-range`     | `DateRangePicker`                                                     | DateField, Calendar, OptionGroupFrame | Needs a range highlight in Calendar. The active endpoint is explicit and shown                                                                                                                                                                                                                                                                                                |
| `loading-blocks` | Placeholder for Button, Chip, fields, Card, Banner, an image or chart | `_shared/Placeholder`                 | Only text and pictures turn into blocks today                                                                                                                                                                                                                                                                                                                                 |
| `later`          | Stepper, Rating, Tree, Command palette, Carousel                      | (decided when asked for)              | "Only if asked for"                                                                                                                                                                                                                                                                                                                                                           |

## Part 4: How the page is organised

A static site with hash routes and no server.

1. **Landing:** the hero; a playground (a token customiser: brand color, corners, text size, spacing,
   typeface, shadows, motion, with the CSS it produces; and a pottery-studio booking page built from the
   library, which restyles live); why three (fewer decisions for users and developers; a vocabulary a coding
   agent can use: the findings and their honest limits, no citations); how to start; and entry points to the
   rest. The less/normal/more demo lives on the `one-scale` principle card, not here.
2. **Principles:** the 10 cards, each with its own permalink.
3. **Components:** a card per component on one page with anchors, grouped like the Storybook sidebar. Each
   card links to its Storybook page.
4. **About:** the author's background in human-computer interaction.

## Part 5: LinkedIn series

One post per principle. Each links to its card's permalink and carries a preview image (a screenshot of the
live demo).

| Post | Slug                  | Working title                                                |
| ---- | --------------------- | ------------------------------------------------------------ |
| 1    | `one-scale`           | Why there is no `sm/md/lg`                                   |
| 2    | `forms-by-research`   | The input that isn't a box: label above, validate on blur    |
| 3    | `affordance`          | A fill says "press me": making things look like what they do |
| 4    | `derived-color`       | One brand color, and everything else follows                 |
| 5    | `loading-is-state`    | Loading is a state of a region                               |
| 6    | `motion-with-purpose` | Motion: spring in, never overshoot out                       |
| 7    | `toast`               | The toast queue: pause on hover, cap at three                |
| 8    | `names-in-types`      | Types that make accessibility hard to forget                 |
| 9    | `intensity-not-kind`  | No `variant`: color is a scale too (Banner, not Alert)       |
| 10   | `one-frame`           | One frame under six fields                                   |

## Part 6: What only the author can supply

- **The voice.** First person ("I chose") or third ("we chose").
- **The stories.** "I learned this on project X". This is what makes the posts the author's and the site
  more than documentation.
- **The About section.** Background in human-computer interaction and front-end work.
- **The decisions in part 3:** colored chips against principle 8, and the nav bar's shape.
- **A check of every claim** against the code before a card is marked `reviewed`.
