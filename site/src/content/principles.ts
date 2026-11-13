/**
 * The principle cards. Slugs, titles, decisions and evidence mirror site/OUTLINE.md part 1: change one,
 * change the other. Each card's issue, reasons and cost are drawn from DESIGN.md.
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
  /** Where to see it: the components a person can use, and what to try on them. */
  evidence: string;
};

export const principles: Principle[] = [
  {
    slug: 'one-scale',
    title: 'One scale, no sm/md/lg/xl',
    issue:
      'A ladder of names (sm, md, lg, xl, 2xl), different for each prop and each component. More to learn, more to theme, and neighbouring steps look alike.',
    decision: 'less, normal or more, plus an escape hatch: any CSS length, or a number of pixels.',
    why: [
      'One rule. The same three words set the size, radius, weight, space and shadow of anything. Learn it on a Button and it works on a Card.',
      'Steps you can tell apart. We see size as a ratio: 16 to 18px shows, 40 to 42px doesn’t. Three clear steps beat five that blur.',
      'Fifteen CSS variables to theme: five scales of three.',
    ],
    cost: 'Only three steps. Anything in between is an escape hatch value.',
    demo: 'scale',
    evidence:
      'Any component. Try size on Button, TextField and Title, or padding, borderRadius and boxShadow on Card: less, normal or more.',
  },
  {
    slug: 'intensity-not-kind',
    title: 'No variants: color is a scale too',
    issue:
      'A variant prop (primary, danger, ghost) and colors named for a meaning (success, warning, error). A color alone can’t carry meaning, and every new kind needs a new value.',
    decision:
      'No variant prop, and no color named for a meaning. Color props take the same three words: how much it stands out, never what it means.',
    why: [
      'Color props exist (background on Button, Card and Banner; color on Text and Title). They take less, normal or more, like every other prop. Button’s more is the brand-colored one; less is the quiet one.',
      'What a message means goes in its words, not in a color someone may not see. Validation errors stay on the field, as GOV.UK advises.',
      'Radius, weight and shadow aren’t props. The component owns its finish, so two Buttons can’t disagree about how round a button is.',
    ],
    cost: 'No ready-made danger button. Pass a CSS color (var(--color-danger)) and check its contrast yourself.',
    demo: 'intensity',
    evidence:
      'Button, Card and Banner (background), Text and Title (color). None of them has a variant prop.',
  },
  {
    slug: 'affordance',
    title: 'Looks like how it behaves',
    issue:
      'Controls styled for the brand, not for what they do. A bare line with a chevron looks like an empty section, and a read-only field looks editable. People find out by pressing.',
    decision:
      'A control looks like what it does: a fill says you can press it, an outline says it is information, and things that do the same job behave the same way.',
    why: [
      'The look should say what you can do. An outline is information, a fill is something you can press, so a plain label is outlined and nobody has to press it to find out.',
      'A thing you can press answers you: it swells under the pointer and shrinks when pressed. State shows by form, not only color: a Toggle shows on or off by its thumb, its fill and its role.',
      'Same job, same behaviour: Tabs, Radio and SegmentedControl share one arrow-key model. And where a look could mislead, something else says it: a read-only field drops its fill and looks like the text it is.',
    ],
    cost: 'It limits the look. A loud label can’t borrow a fill without looking pressable, and flat design where buttons look like text isn’t on offer.',
    demo: 'affordance',
    evidence:
      'Chip (outlined, removable or selectable), Collapsible, Calendar, Toggle and a read-only TextField. Each shows what it does before you try it.',
  },
  {
    slug: 'names-in-types',
    title: 'Accessible names enforced by type',
    issue:
      'The accessible name is an optional prop, so it gets forgotten. An icon-only button ships nameless and a screen reader says only “button”.',
    decision:
      'An icon-only Button without aria-label is a type error; a Dialog needs a title or a label.',
    why: [
      'A screen reader user can’t work the name out from the picture, so the types require it. An icon-only Button needs aria-label, a Dialog needs a title or a label, and a field needs a visible label or a name. Without one it doesn’t compile.',
      'Icons are hidden from assistive technology on purpose, so the name stands in for them.',
    ],
    cost: 'A little more to write. The types check there is a name, not that it’s a good one: “button” still compiles.',
    demo: 'names',
    evidence:
      'Button, Dialog and every field. Leave the name out in your editor and it won’t compile.',
  },
  {
    slug: 'native-first',
    title: 'Native elements first',
    issue:
      'A custom dialog, switch or slider is a div that must rebuild focus, keyboard, form submission and roles by hand. Each rebuild is a chance to miss one.',
    decision:
      'dialog, fieldset, input type=range, the Popover API and role=switch, before anything custom.',
    why: [
      'The browser already has it. Toggle is a checkbox with role=switch, so Space, form submission and the on or off announcement come free. Slider is a range input. Dialog uses showModal, so the page behind goes inert, Tab stays inside and Escape works. The custom drawing goes over the native element, not in place of it.',
      'It’s faster too. The browser does the focus trap, the top layer and (with CSS anchor positioning) where a popup sits, so the library ships none of that code. Its only dependency is clsx. That’s less JavaScript on the phone of whoever is using it. We haven’t benchmarked it: it’s less code, not a number.',
    ],
    cost: 'You take the platform’s quirks, and its browser floor: a 2024 browser (Popover API, :has(), color-mix()).',
    demo: 'native',
    evidence:
      'Dialog and Drawer (dialog), Toggle (role=switch), Slider (range input), Checkbox and Radio (fieldset), Popover, Menu and Tooltip (Popover API).',
  },
  {
    slug: 'forms-by-research',
    title: 'Forms follow the research',
    issue:
      'A placeholder as the label (it vanishes as you type), an error on every keystroke, a message that says something’s wrong but not what to do.',
    decision:
      'A visible label above, no placeholder as a label, a specific error below, validated on blur, and the caller decides when.',
    why: [
      'From NN/g and GOV.UK: a visible label above, no placeholder as the label, required fields marked, and an error that is specific and sits below the field.',
      'Checked when you leave the field, not on each keystroke. The component doesn’t validate: you decide when and pass the error, and it draws it with an icon, so it isn’t color alone.',
      'The ⓘ tooltip sits beside the label, so the field’s name stays “Email”, not “Email About Email”.',
    ],
    cost: 'You write the rule and choose the moment. Hint text that must always show isn’t built yet.',
    demo: 'forms',
    evidence:
      'TextField: the label above, the error below once you leave the field, the ⓘ beside the label. Textarea, Select and the other fields do the same.',
  },
  {
    slug: 'motion-with-purpose',
    title: 'Motion with a purpose',
    issue:
      'One stock curve on everything, or none. Overshooting on the way out dips below where it started, and ignoring reduced-motion hurts people who are sensitive to it.',
    decision:
      'Springy on enter, no overshoot on leave, three easing curves, and prefers-reduced-motion respected.',
    why: [
      'Three curves, each defined once. Enter overshoots a few percent and settles: springy. Leave doesn’t overshoot, so nothing dips and wobbles. Pop is gentler, for small marks like a Toggle’s thumb.',
      'Every pressable control answers the pointer and shrinks when pressed, so movement tells you a thing is live.',
      'With prefers-reduced-motion, one rule for the whole library cuts motion to almost nothing.',
    ],
    cost: 'New moving components must use the three curves. Springiness is a taste: override the curves for none.',
    demo: 'motion',
    evidence:
      'Hover and press Button, Chip and Toggle. Open a Dialog or show a Toast to see enter and leave. Tune the curves with --ease-enter, --ease-leave and --ease-pop.',
  },
  {
    slug: 'derived-color',
    title: 'One brand color; the rest is derived',
    issue:
      'A palette: numbered shades (50 to 900) and a family per role. Someone picks every shade, keeps them harmonious and pairs each fill with readable text. Change the brand and you do it all again.',
    decision:
      'Pick one brand color. Fills, tints, shadows, the focus ring and the text on them are derived in CSS, so re-skinning is changing one value.',
    why: [
      'One input, dozens of colors. The button tint is the brand mixed toward the page, the field fill is the brand at 15%, the shadow is the brand darkened. Change it and they all follow, as the example shows.',
      'Harmonious by construction: every derived color is the brand at a different strength, so they’re one hue and can’t clash. The text on each is black or white, whichever contrasts more.',
      'Derived doesn’t mean identical. Sand is 2.09:1 on white, under the 3:1 WCAG asks of a graphic, so the badge uses a darker mix. And it isn’t red: red on everything stops being seen (Braze calls it “red dot blindness”).',
    ],
    cost: 'Color carries little alone: no success green or warning amber, so say it in words and an icon. A very pale brand gives weak tints, and the dark theme sets a few fills by hand.',
    demo: 'color',
    evidence:
      'Button, Chip, Toggle, TextField, Slider, Progress, Banner and Indicator all follow --color-primary. Change that one variable.',
  },
  {
    slug: 'loading-is-state',
    title: 'Loading is the state of a region',
    issue:
      'A Skeleton is a second layout to keep in step with the real one, its heights matched by hand.',
    decision: 'aria-busy on any element. No Skeleton component, no isLoading prop.',
    why: [
      'Loading is the state of a region, so one attribute says it: aria-busy="true". The text, titles and avatars inside become quiet blocks.',
      'The real components render with placeholder content, so the layout and height are the real ones.',
      'Nothing is disabled: buttons and fields inside stay usable.',
    ],
    cost: 'Only text and pictures become blocks today; buttons, fields and cards don’t. You pick placeholder text of about the right length.',
    demo: 'loading',
    evidence:
      'Put aria-busy="true" on a Stack or Card that holds Text, Title, Avatar or a Table, and they turn into blocks.',
  },
  {
    slug: 'one-frame',
    title: 'Consistency by construction',
    issue:
      'Built one by one, each field rewrites the label, error and id wiring, and they drift: one announces its error, another doesn’t.',
    decision: 'Six fields share one frame, so they can’t drift apart.',
    why: [
      'TextField, Textarea, Select, Slider, FileUpload and DateField share one frame: label, error and wiring. Each draws only its own control.',
      'Checkbox, Radio and SegmentedControl share a second one for groups. Both use the same label and error.',
      'A new input looks and behaves like the rest, and a fix is made once.',
    ],
    cost: 'A new input has to fit the frame, and some bend it: Slider draws its own control, FileUpload uses its drop zone.',
    demo: 'frame',
    evidence:
      'TextField, Textarea, Select, Slider, FileUpload and DateField share one frame; Checkbox, Radio and SegmentedControl share another. Turn on an error in each and compare.',
  },
];
