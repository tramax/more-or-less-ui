import {
  createElement,
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { CheckIcon } from '../_shared/CheckIcon';
import { CrossIcon } from '../_shared/CrossIcon';
import { OptionIcon } from '../_shared/OptionIcon';
import styles from './Chip.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const CHIP_DEFAULTS = {
  size: 'normal',
} as const;

// `size` sets font-size only: the height, the padding and the gaps are in em (see Chip.module.css),
// so they follow it, escape-hatch values included. `size="1em"` takes the surrounding text's size.
const SCALE_SPEC = {
  // Empty, so the direct props are inferred as none rather than as any string
  direct: [],
  compound: { size: ['fontSize'] },
  defaults: CHIP_DEFAULTS,
} as const;

type ChipBaseProps = {
  /** Sets the font size; the height, the padding and the gaps follow it. `1em` takes the surrounding text's size. */
  size?: ScaleProp;
  /** The label. Short text; a removable chip's remove button is named after it ("Remove <label>"). */
  children: string;
  /** Shown before the label: a flag, an avatar, a logo. Decorative: the label is the name. A selected chip shows a ✓ here instead. */
  icon?: ReactNode;
};

/** What a chip can be disabled with: dimmed, and it does not react. */
type DisabledProp = {
  /**
   * Dimmed, with no hover or press. A removable chip also loses its × and does not call `onRemove`;
   * a selectable one is natively disabled.
   */
  isDisabled?: boolean;
};

export type StaticChipProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'children'> &
  ChipBaseProps & {
    onRemove?: never;
    isInField?: never;
    isSelected?: never;
    onSelectedChange?: never;
    isDisabled?: never;
  };

export type RemovableChipProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'children'> &
  ChipBaseProps &
  DisabledProp & {
    /**
     * Adds a remove button (a ×), and makes the whole chip the target: a click anywhere on it calls
     * this. The chip doesn't hide itself: the caller stops rendering it.
     */
    onRemove: () => void;
    /**
     * The chip sits in a field that is already one Tab stop and removes its last chip with Backspace
     * (Select): the remove button leaves the tab order. Elsewhere the button is a Tab stop, so a
     * keyboard can remove the chip.
     */
    isInField?: boolean;
    isSelected?: never;
    onSelectedChange?: never;
  };

export type SelectableChipProps = Omit<
  ButtonHTMLAttributes<HTMLElement>,
  'color' | 'children' | 'type' | 'disabled' | 'aria-pressed'
> &
  ChipBaseProps &
  DisabledProp & {
    /** Whether it is selected (controlled). Also set as `aria-pressed`. */
    isSelected: boolean;
    /** Called with the new state when the chip is clicked or pressed. */
    onSelectedChange: (isSelected: boolean) => void;
    onRemove?: never;
    isInField?: never;
  };

/**
 * One of three, never mixed: static (no handler), removable (`onRemove`) or selectable (`isSelected`
 * and `onSelectedChange`). A × inside a toggle button would be a button in a button.
 */
export type ChipProps = StaticChipProps | RemovableChipProps | SelectableChipProps;

/**
 * A small pill. With no handler it is a label: outlined, and it does nothing when hovered or pressed
 * (a status word like "Beta", a category). With `onRemove` it is a value the user can take out; with
 * `isSelected` and `onSelectedChange` it is a choice the user switches on and off. Those two are
 * filled, and react to hover and press: an outline is information, a fill is something you can press.
 */
export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(props, ref) {
  if (props.onSelectedChange) return <SelectableChip {...props} ref={ref} />;
  if (props.onRemove) return <RemovableChip {...props} ref={ref} />;
  return <StaticChip {...props} ref={ref} />;
});

type PillProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'children'> & {
  /** `button` for a chip that toggles; `span` for the others. */
  as?: 'span' | 'button';
  /** Only on a `button` root. */
  type?: 'button';
  disabled?: boolean;
  size?: ScaleProp;
  label: string;
  icon?: ReactNode;
  /** After the label: the remove button. */
  children?: ReactNode;
};

// The pill all three share: the root element, `size`, the icon slot, the label and room for trailing
// content. No fill and no reaction; each kind adds its own through `className`.
const Pill = forwardRef<HTMLElement, PillProps>(function Pill(
  { as = 'span', label, icon, children, className, style, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(styles, SCALE_SPEC, props);

  // createElement, not <Element>: the root is a span or a button, and a union of tags would make the
  // ref and the handlers a union too
  return createElement(
    as,
    {
      ...rest,
      ref,
      className: clsx(styles.chip, classNames, className),
      style: { ...scaleStyle, ...style },
    },
    icon != null && icon !== false && <OptionIcon className={styles.leading}>{icon}</OptionIcon>,
    <span className={styles.label}>{label}</span>,
    children,
  );
});

const StaticChip = forwardRef<HTMLElement, StaticChipProps>(function StaticChip(
  { children, className, ...props },
  ref,
) {
  return <Pill {...props} ref={ref} label={children} className={clsx(styles.static, className)} />;
});

const RemovableChip = forwardRef<HTMLElement, RemovableChipProps>(function RemovableChip(
  {
    children,
    onRemove,
    isInField = false,
    isDisabled = false,
    onClick,
    onMouseDown,
    className,
    ...props
  },
  ref,
) {
  return (
    // The whole chip is the target, so a click anywhere on it removes. The button inside is its
    // accessible name and what assistive tech activates; its click bubbles up to here. mousedown is
    // cancelled so a field around the chip keeps focus. The click is marked handled (preventDefault)
    // so the field around the chip doesn't also open its popup.
    <Pill
      {...props}
      ref={ref}
      label={children}
      className={clsx(
        styles.removable,
        isDisabled ? styles.disabled : styles.interactive,
        className,
      )}
      onMouseDown={(event: MouseEvent<HTMLElement>) => {
        onMouseDown?.(event);
        if (!isDisabled) event.preventDefault();
      }}
      onClick={(event: MouseEvent<HTMLElement>) => {
        onClick?.(event);
        if (isDisabled) return;
        event.preventDefault();
        onRemove();
      }}
    >
      {!isDisabled && (
        <button
          type="button"
          tabIndex={isInField ? -1 : undefined}
          className={styles.remove}
          aria-label={`Remove ${children}`}
        >
          <CrossIcon className={styles.cross} />
        </button>
      )}
    </Pill>
  );
});

const SelectableChip = forwardRef<HTMLElement, SelectableChipProps>(function SelectableChip(
  {
    children,
    icon,
    isSelected,
    onSelectedChange,
    isDisabled = false,
    onClick,
    className,
    ...props
  },
  ref,
) {
  return (
    <Pill
      {...props}
      ref={ref}
      as="button"
      type="button"
      disabled={isDisabled}
      aria-pressed={isSelected}
      label={children}
      // The ✓ takes the icon's place, so selection is not color alone
      icon={isSelected ? <CheckIcon /> : icon}
      className={clsx(
        styles.selectable,
        isSelected && styles.selected,
        isDisabled ? styles.disabled : styles.interactive,
        className,
      )}
      onClick={(event: MouseEvent<HTMLElement>) => {
        onClick?.(event);
        onSelectedChange(!isSelected);
      }}
    />
  );
});
