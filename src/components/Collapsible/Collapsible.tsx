import { forwardRef, useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { ChevronIcon } from '../_shared/ChevronIcon';
import { OptionIcon } from '../_shared/OptionIcon';
import sizes from '../_shared/Size.module.css';
import styles from './Collapsible.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const COLLAPSIBLE_DEFAULTS = {
  size: 'normal',
} as const;

// `size` sets font-size only: the padding and the gaps are in em (see Collapsible.module.css), so they
// follow it, escape-hatch values included. Its classes are _shared/Size.module.css, since `size` is the
// only scale prop.
const SCALE_SPEC = {
  // Empty, so the direct props are inferred as none rather than as any string
  direct: [],
  compound: { size: ['fontSize'] },
  defaults: COLLAPSIBLE_DEFAULTS,
} as const;

export type CollapsibleProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'color' | 'children' | 'defaultValue'
> & {
  /** The header's text: the name of what is folded away. The whole header is the button. */
  title: ReactNode;
  /** A glyph before the title. Decorative: `title` stays the name. */
  icon?: ReactNode;
  /** What opens and closes. It stays mounted while closed (hidden from everyone), so its state is kept. */
  children: ReactNode;
  /** Controlled: whether it is open. Pair it with `onOpenChange`. */
  isOpen?: boolean;
  /** Whether it starts open, when uncontrolled. Closed without it. */
  defaultIsOpen?: boolean;
  /** Called with the new state when the header is pressed. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Not pressable, not focusable, dimmed. It stays as open or closed as it was. */
  isDisabled?: boolean;
  /** Sets the font size; the padding and the gaps follow it. `1em` takes the surrounding text's size. */
  size?: ScaleProp;
};

/**
 * One piece of content that a header folds away: the details of a row, an "Advanced" section of a form,
 * an answer under its question. For several that open one at a time use Accordion; for choosing between
 * panels use Tabs.
 *
 * Follows the WAI-ARIA APG disclosure pattern: the header is a `button` with `aria-expanded` and
 * `aria-controls`, and Enter and Space press it as they do any button. The closed content is
 * `visibility: hidden`, so it is out of the tab order and the accessibility tree while staying mounted.
 */
export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  {
    title,
    icon,
    children,
    isOpen: isOpenProp,
    defaultIsOpen = false,
    onOpenChange,
    isDisabled = false,
    id,
    className,
    style,
    ...props
  },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(sizes, SCALE_SPEC, props);
  const autoId = useId();
  const rootId = id ?? autoId;
  const panelId = `${rootId}-panel`;

  // Not an input, but a Collapsible's state is usually its own, as Popover's and Dialog's are: it keeps
  // it unless `isOpen` is given
  const [internalOpen, setInternalOpen] = useState(defaultIsOpen);
  const isOpen = isOpenProp ?? internalOpen;
  const toggle = () => {
    if (isOpenProp === undefined) setInternalOpen(!isOpen);
    onOpenChange?.(!isOpen);
  };

  return (
    <div
      {...rest}
      ref={ref}
      id={id}
      // The panel's height and the chevron follow this, in CSS
      data-state={isOpen ? 'open' : 'closed'}
      className={clsx(styles.root, classNames, className)}
      style={{ ...scaleStyle, ...style }}
    >
      <button
        type="button"
        className={styles.header}
        aria-expanded={isOpen}
        aria-controls={panelId}
        disabled={isDisabled}
        onClick={toggle}
      >
        {icon != null && icon !== false && <OptionIcon className={styles.icon}>{icon}</OptionIcon>}
        <span className={styles.title}>{title}</span>
        <ChevronIcon className={styles.chevron} />
      </button>
      {/* Two boxes: the outer one animates its row from 0fr to 1fr, the inner one clips (it has no
          padding, so it can shrink to nothing) */}
      <div id={panelId} className={styles.panel}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
});
