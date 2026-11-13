/**
 * The principle cards. Slugs, titles, decisions and evidence mirror site/OUTLINE.md part 1: change one,
 * change the other. Every card is a draft: its issue, reasons and cost are drawn from DESIGN.md and
 * are not yet checked against the code by the author.
 */
export type DemoKey =
  | 'scale'
  | 'intensity'
  | 'affordance'
  | 'names'
  | 'native'
  | 'forms'
  | 'motion'
  | 'color'
  | 'loading'
  | 'frame';

export type Principle = {
  slug: string;
  title: string;
  /** What goes wrong with the existing convention. */
  issue: string;
  /** Our choice, in one sentence. */
  decision: string;
  /** The user need and its source, one paragraph each. */
  why: string[];
  /** The trade-off accepted. */
  cost: string;
  /** A live example, keyed to pages/Principles.tsx. */
  demo: DemoKey;
  /** Where in the library to see it. */
  evidence: string;
};

export const principles: Principle[] = [
  {
    slug: 'one-scale',
    title: 'One scale, no sm/md/lg/xl',
    issue:
      'A ladder of named steps (sm, md, lg, xl, 2xl), usually a different one for each prop and each component. There are more names to learn and more variables to theme, and neighbouring steps are hard to tell apart.',
    decision: 'less, normal or more, plus an escape hatch: any CSS length, or a number of pixels.',
    why: [
      'One mental model. The same three words set the size, the radius, the weight, the space and the shadow of anything. Learn it on a Button and it holds on a Card, a TextField and a Toast.',
      'Each step is one you can tell apart. A difference in size is seen as a ratio, so a step from 16 to 18px shows and one from 40 to 42px doesn’t. Three steps that are visibly different beat five that blur together.',
      'Fifteen CSS variables to theme, not a ladder per component: five scales (size, radius, weight, space, elevation) with three values each.',
    ],
    cost: 'Only three steps. Anything between or beyond is an escape hatch value, which leaves the scale for that one prop.',
    demo: 'scale',
    evidence: 'Title’s sizes are ratios: 16 to 18px shows; 40 to 42px doesn’t.',
  },
  {
    slug: 'intensity-not-kind',
    title: 'No variants: color is a scale too',
    issue:
      'A variant prop (primary, secondary, danger, ghost) and colors named for a purpose (success, warning, error). The look then claims a meaning that a color alone can’t carry: a reader who can’t tell the colors apart misses it, and every new kind needs a new value.',
    decision:
      'No variant prop, and no color named for a meaning. Color props exist, but they take the same three words: how much it stands out, never what it means.',
    why: [
      'There are color props: background on Button, Card and Banner, color on Text and Title. They are named for the CSS property they set, so an escape hatch reads naturally (background="linear-gradient(...)"), and they take less, normal or more, like every other prop. Button’s more is the brand-colored one; less is the quiet one.',
      'What a message means is said in its words, and not in a color a reader may not see. A Banner that needs to say which kind it is does so in its text; validation errors stay on the field, as GOV.UK advises, and don’t go in a banner.',
      'Radius, weight and shadow aren’t props at all. The component owns its finish, so two Buttons on one page can’t disagree about how round a button is.',
    ],
    cost: 'No ready-made danger button or success banner. For one, pass a CSS color to the escape hatch (var(--color-danger)) and check its contrast yourself.',
    demo: 'intensity',
    evidence:
      'Button, Card and Banner take background; Text and Title take color. Banner: background is intensity, not severity.',
  },
  {
    slug: 'affordance',
    title: 'Looks like how it behaves',
    issue:
      'Controls styled to match the brand, with little regard for what they do. A bare line of text with a chevron looks like an empty section; a label and a button can look alike; a field you can’t edit looks like one you can. People find out by pressing.',
    decision:
      'A control looks like what it does: a fill says you can press it, an outline says it is information, and things that do the same job behave the same way.',
    why: [
      'The look of a thing should tell you what you can do with it. The library’s rule for Chip says it: an outline is information, a fill is something you can press. Fields, Checkbox, Radio, Toggle and Button are filled, so a plain label (a Chip with no handler) is outlined, and nobody has to press it to find out.',
      'A thing you can press answers you. Pressable controls lift or swell under the pointer and shrink when pressed, so a control that responds is a control that works. The state shows by form too, not only by color: a Toggle shows on or off by where the thumb sits, how full the track is, an icon, and its role.',
      'Where the look alone could mislead, something else says it. A collapsed section’s header is filled, because a bare line with a chevron looked like an empty section. The Calendar’s month name ends in a chevron because it is pressable and nothing else would say so, and the year’s name, which is not, has none. A read-only field drops its fill and its padding, so it looks like the plain text it is.',
      'Things that do the same job behave the same way. Tabs, Radio and SegmentedControl share one arrow-key model. A Toggle is for a setting that applies at once and a Checkbox for a choice that waits for Save. A person who has used one already knows the next.',
    ],
    cost: 'The rule limits the look. A label that must be loud can’t borrow a fill without looking like something to press, and a flat design where pressable things look like text isn’t on offer.',
    demo: 'affordance',
    evidence:
      'Chip, Collapsible, Calendar, Toggle, TextField: each shows what it can do before you try.',
  },
  {
    slug: 'names-in-types',
    title: 'Accessible names enforced by type',
    issue:
      'The accessible name is an optional prop, or an afterthought, so it gets forgotten. An icon-only button ships with no name and a screen reader says only “button”. Nothing flags it until someone tests with a screen reader.',
    decision:
      'An icon-only Button without aria-label is a type error; a Dialog needs a title or a label.',
    why: [
      'The name is the one thing a screen reader user can’t work out from the picture. So the types require it where a control would otherwise have none: an icon-only Button needs aria-label or aria-labelledby, and a Dialog needs a visible title or a label.',
      'The same rule runs through every labelled input (NameProps): a field either has a visible label or says how it is named. A TextField with neither does not compile.',
      'Icons are decorative on purpose (hidden from assistive technology), so the name is what the content would have been.',
    ],
    cost: 'A little more to write, where you might have wanted nothing. And the types check that there is a name, not that it is a good one: a name of “button” still compiles.',
    demo: 'names',
    evidence: 'Button, Dialog, NameProps.',
  },
  {
    slug: 'native-first',
    title: 'Native elements first',
    issue:
      'A custom dialog, switch or slider is a div that has to rebuild focus, keyboard, form submission and screen reader roles by hand. Each rebuild is a chance to miss one.',
    decision:
      'dialog, fieldset, input type=range, the Popover API and role=switch, before anything custom.',
    why: [
      'A native element has them already. Toggle is a checkbox input with role=switch, so Space, form submission and the on or off announcement come free. Slider is a range input. Dialog is a dialog element opened with showModal, which makes the page behind inert so Tab stays inside it, with Escape and the backdrop built in. A fieldset and its legend name a group of options.',
      'Where a native element exists it is used, and the custom drawing goes over it (the Toggle’s thumb, the Slider’s fill), not in place of it.',
    ],
    cost: 'You take what the platform gives, quirks included, and its browser floor: the styles need a 2024 browser (the Popover API, :has(), color-mix()).',
    demo: 'native',
    evidence: 'Dialog, Toggle, Slider.',
  },
  {
    slug: 'forms-by-research',
    title: 'Forms follow the research',
    issue:
      'The shortcuts in common form patterns: a placeholder used as the label, which vanishes as you type; an error on every keystroke, before you have finished; a message that says something is wrong without saying what to do.',
    decision:
      'A visible label above, no placeholder as a label, a specific error below, validated on blur, and the caller decides when.',
    why: [
      'Based on NN/g and GOV.UK guidance: a visible label above the field, no placeholder as the label or the hint, required fields marked, and an error that is specific and sits below the field.',
      'The field is checked when you leave it, not on each keystroke. The component doesn’t validate: the caller decides when and passes the error, and the field only draws it, with an icon so the error isn’t color alone.',
      'The tooltip (an ⓘ button) sits beside the label, not inside it, so the field’s name stays “Email” and doesn’t become “Email About Email”.',
    ],
    cost: 'The component won’t validate for you: you write the rule and choose the moment. And hint text that must always be visible isn’t built yet; a tooltip is behind a button.',
    demo: 'forms',
    evidence: 'TextField (NN/g, GOV.UK).',
  },
  {
    slug: 'motion-with-purpose',
    title: 'Motion with a purpose',
    issue:
      'One stock curve on everything, or none. An element that overshoots on its way out dips below where it started, and motion that ignores the reduced-motion setting is a problem for people who are sensitive to it.',
    decision:
      'Springy on enter, no overshoot on leave, three easing curves, and prefers-reduced-motion respected.',
    why: [
      'Three easing curves, each defined once and used by everything that moves. The enter curve overshoots its target by a few percent and settles, so a control feels springy as the pointer arrives. The leave curve has no overshoot, so nothing dips below its resting value once the pointer has gone. The pop curve is gentler, for small marks like Radio’s dot and Toggle’s thumb.',
      'Every pressable control moves the same way: it answers the pointer and shrinks when pressed, so movement tells you a thing is live.',
      'With prefers-reduced-motion, animations and transitions are cut to almost nothing, by one rule for the whole library.',
    ],
    cost: 'Every new moving component has to use the three curves and not its own. And the springiness is a taste: a team that wants none overrides the curves.',
    demo: 'motion',
    evidence: '--ease-enter, --ease-leave, --ease-pop.',
  },
  {
    slug: 'derived-color',
    title: 'One brand color; the rest is derived',
    issue:
      'A palette: a brand color plus numbered shades (50 to 900) and a family for each role (primary, secondary, success, warning, danger). Someone has to pick every shade by hand, keep them harmonious, and pair each fill with a text color that reads on it. Change the brand color and you pick them all again.',
    decision:
      'Pick one brand color. The fills, tints, shadows, focus ring and the text on them are all derived from it in CSS, so they share a hue by construction, and re-skinning is changing one value.',
    why: [
      'One input, dozens of colors. The brand color is the only color you choose. The button’s tint is the brand color mixed toward the page color, the stronger variant is mixed toward the text color, the field fill is the brand color at 15% (25% on hover), and the shadow tint is the brand color darkened. The focus ring, text selection, slider, progress, chips and banners all read from it too. Change it and they follow, as the example shows.',
      'Harmonious by construction. Every derived color is the brand color at a different strength, over the page or toward the text, so they are one hue and can’t clash the way colors picked one by one can. Even the Avatar’s colors, which differ by name, share one lightness and chroma, so they sit with the brand color.',
      'The text on a color is derived too. The mark on the brand fill (the tick in a Checkbox, the dot in a Radio, the label on a filled Button) is black or white, whichever contrasts more with the brand color, worked out in CSS. A darker brand color gets light text without anyone setting it.',
      'Derived doesn’t mean identical: where the brand color can’t do a job, a variant of it does. The sand brand color is 2.09:1 on white, below the 3:1 that WCAG asks of a graphic, so the badge uses a darker mix of it. Red is kept for errors, which have their own color, so a badge isn’t red: a red mark says something is wrong, and used on everything it stops being seen (Braze calls it “red dot blindness”).',
    ],
    cost: 'Everything is one hue, so color can carry little information by itself: there is no success green or warning amber, and you say it in words, with an icon. Derivation can’t rescue a poor brand color, as a very pale one gives weak tints. And the dark theme sets a few fills by hand (a dark umber for the strongest ones), so on a dark page those don’t follow a recolored brand.',
    demo: 'color',
    evidence:
      'tokens.css: --color-primary-tint, --color-primary-strong, --color-field-background, --color-on-primary, --shadow-color.',
  },
  {
    slug: 'loading-is-state',
    title: 'Loading is the state of a region',
    issue:
      'A Skeleton component is a second layout to keep in step with the real one, and its heights have to be matched by hand.',
    decision: 'aria-busy on any element. No Skeleton component, no isLoading prop.',
    why: [
      'Loading is the state of a region, so one attribute says it: aria-busy="true" on any element. The Text, Title, Avatar and option text inside become quiet blocks.',
      'The real components are rendered, with placeholder content, so the layout is the real one and the height matches by construction.',
      'aria-busy is the standard way to say a region is updating. A placeholder isn’t disabled: buttons and fields inside stay usable.',
    ],
    cost: 'Only text and pictures turn into blocks today; buttons, fields and cards don’t. You pick placeholder text of about the right length, and the number of rows isn’t solved here.',
    demo: 'loading',
    evidence: '_shared/Placeholder.',
  },
  {
    slug: 'one-frame',
    title: 'Consistency by construction',
    issue:
      'When each field is built on its own, the label, the error message and the id, aria-invalid and aria-describedby wiring are written again for each one, and drift: one field announces its error and another doesn’t.',
    decision: 'Six fields share one frame, so they can’t drift apart.',
    why: [
      'TextField, Textarea, Select, Slider, FileUpload and DateField share one frame: the root, the size, the label, the error message and the wiring that connects them. Each component draws only its own control.',
      'Checkbox, Radio and SegmentedControl share a second frame for a group of options (the fieldset, the legend and the error), and both frames use the same error message and label.',
      'So a new input is built to look and behave like the others, and a fix is made once.',
    ],
    cost: 'A new input has to fit the frame, and some bend it: Slider draws its own control, and FileUpload puts the field’s box on its drop zone.',
    demo: 'frame',
    evidence: 'TextFieldFrame, OptionGroupFrame.',
  },
];
