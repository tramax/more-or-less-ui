// Cleans up the code snippet that Storybook builds from a story's args, for `parameters.docs.source.transform`.

// `argTypes: { onChange: { action: ... } }` puts a logging spy in the args, and the snippet prints it
// as `onChange={() => {}}`. The components don't require a handler, so the snippet shouldn't suggest one.
const omitActions = (code: string) => code.replace(/\s+on[A-Z]\w*=\{\(\) => \{\}\}/g, '');

// Closing up a tag whose props were all dropped: `<Box >` -> `<Box>`, `<TextField />` stays as is
const tidyTags = (code: string) =>
  code.replace(/<(\w+)\s+>/g, '<$1>').replace(/<(\w+)\s+\/>/g, '<$1 />');

/** Snippet transform for a component with no `*_DEFAULTS`, or whose defaults are all shown. */
export const withoutActions = (code: string) => tidyTags(omitActions(code));

/**
 * Snippet transform that also drops props at their default, so a bare `<Select>` shows as such. The
 * controls start at the defaults, but users don't have to write them.
 */
export const omitDefaults = (defaults: Record<string, string>) => (code: string) =>
  tidyTags(
    Object.entries(defaults).reduce(
      (c, [prop, value]) => c.replace(new RegExp(String.raw`\s+${prop}="${value}"`, 'g'), ''),
      omitActions(code),
    ),
  );

/**
 * `parameters` for a story whose `render` returns a wrapper component, so Storybook has no component
 * element to print and would show the story object instead. The snippet is written out and shown as
 * is. The controls are off unless the wrapper passes `args` through (`hasControls`).
 */
export const showCode = (code: string, { hasControls = false } = {}) => ({
  ...(hasControls ? {} : { controls: { disable: true } }),
  docs: { source: { code, transform: (c: string) => c } },
});

/**
 * Snippet transform for a story whose controls render through a stateful wrapper (`Stateful`), because
 * the component is always controlled and a story needs somewhere to keep the value. Storybook prints the
 * wrapper (`<Stateful value="account" />`); this prints what a user writes: the component itself, with
 * the prop taken from their own state and the handler that sets it (`<Tabs value={value}
 * onChange={setValue} />`). Drops props at their default as `omitDefaults` does.
 *
 * `prop` is the controlled prop (`value`, `page`); `setter` is what the user's `useState` calls it.
 */
export const asControlled =
  (
    defaults: Record<string, string>,
    { as, prop, setter }: { as: string; prop: string; setter: string },
  ) =>
  (code: string) =>
    omitDefaults(defaults)(code)
      .replace('<Stateful', `<${as}`)
      // The starting value (a string or an expression: `value="account"`, `page={5}`) is the story's
      // own; the user's is their state
      .replace(new RegExp(String.raw`\b${prop}=(?:"[^"]*"|\{[^{}]*\})`), `${prop}={${prop}}`)
      // Before the closing `/>`, in the layout the printer chose: one line, or one prop per line
      .replace(/(\s*)\/>\s*$/, (_, space: string) =>
        space.includes('\n')
          ? `\n  onChange={${setter}}${space}/>`
          : ` onChange={${setter}}${space}/>`,
      );
