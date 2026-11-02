import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { Tooltip } from './Tooltip';
import overlayStyles from '../_shared/Overlay.module.css';

const renderTooltip = (props: Partial<Parameters<typeof Tooltip>[0]> = {}) =>
  render(
    <Tooltip content="Save the file" {...props}>
      <button type="button">Save</button>
    </Tooltip>,
  );

const trigger = () => screen.getByRole('button', { name: 'Save' });
const tip = () => screen.queryByRole('tooltip', { hidden: true });
// Keyboard focus, as a browser would give it. fireEvent.focus doesn't move focus, so :focus-visible
// would not match.
const focus = () =>
  act(() => {
    trigger().focus();
  });
const blur = () =>
  act(() => {
    trigger().blur();
  });
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Tooltip', () => {
  describe('showing', () => {
    it('shows at once by default', () => {
      renderTooltip();
      fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
      expect(tip()?.textContent).toBe('Save the file');
    });

    it('shows after a delay while the pointer rests on the trigger', () => {
      vi.useFakeTimers();
      renderTooltip({ delay: 400 });
      fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
      expect(tip()).toBeNull();
      advance(399);
      expect(tip()).toBeNull();
      advance(1);
      expect(tip()?.textContent).toBe('Save the file');
    });

    it('does not show if the pointer leaves first', () => {
      vi.useFakeTimers();
      renderTooltip({ delay: 400 });
      fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
      advance(100);
      fireEvent.pointerLeave(trigger());
      advance(1000);
      expect(tip()).toBeNull();
    });

    it('ignores a touch: there is no resting pointer', () => {
      vi.useFakeTimers();
      renderTooltip();
      // jsdom has no PointerEvent, so `pointerType` can't be given to the event constructor
      const event = createEvent.pointerEnter(trigger());
      Object.defineProperty(event, 'pointerType', { value: 'touch' });
      fireEvent(trigger(), event);
      advance(1000);
      expect(tip()).toBeNull();
    });

    it('shows at once on keyboard focus', () => {
      renderTooltip();
      focus();
      expect(tip()).not.toBeNull();
    });
  });

  describe('hiding', () => {
    const shown = () => {
      vi.useFakeTimers();
      renderTooltip({ delay: 0 });
      fireEvent.pointerEnter(trigger(), { pointerType: 'mouse' });
      expect(tip()?.dataset.state).toBe('open');
    };

    it('hides shortly after the pointer leaves, then unmounts after its exit', () => {
      shown();
      fireEvent.pointerLeave(trigger());
      expect(tip()?.dataset.state).toBe('open');
      advance(100);
      expect(tip()?.dataset.state).toBe('closed');
      expect(tip()?.getAttribute('aria-hidden')).toBe('true');
      advance(250);
      expect(tip()).toBeNull();
    });

    it('stays while the pointer is on the tooltip itself', () => {
      shown();
      fireEvent.pointerLeave(trigger());
      fireEvent.pointerEnter(tip() as HTMLElement);
      advance(1000);
      expect(tip()?.dataset.state).toBe('open');
      fireEvent.pointerLeave(tip() as HTMLElement);
      advance(100);
      expect(tip()?.dataset.state).toBe('closed');
    });

    it('hides on Escape', () => {
      shown();
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(tip()?.dataset.state).toBe('closed');
    });

    it('hides when the trigger is pressed', () => {
      shown();
      fireEvent.pointerDown(trigger());
      expect(tip()?.dataset.state).toBe('closed');
    });

    it('hides on blur', () => {
      renderTooltip();
      focus();
      blur();
      expect(tip()?.dataset.state).toBe('closed');
    });
  });

  describe('trigger', () => {
    it('describes the trigger while it is shown, and only then', () => {
      renderTooltip();
      expect(trigger().getAttribute('aria-describedby')).toBeNull();
      focus();
      expect(trigger().getAttribute('aria-describedby')).toBe(tip()?.id);
      blur();
      expect(trigger().getAttribute('aria-describedby')).toBeNull();
    });

    it('keeps the trigger own description', () => {
      render(
        <Tooltip content="Tip">
          <button type="button" aria-describedby="own">
            Save
          </button>
        </Tooltip>,
      );
      focus();
      expect(trigger().getAttribute('aria-describedby')).toBe(`own ${tip()?.id}`);
    });

    it('keeps the trigger own handlers, style and ref', () => {
      const onFocus = vi.fn();
      const ref = createRef<HTMLButtonElement>();
      render(
        <Tooltip content="Tip">
          <button type="button" ref={ref} onFocus={onFocus} style={{ color: 'red' }}>
            Save
          </button>
        </Tooltip>,
      );
      focus();
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(ref.current).toBe(trigger());
      expect(trigger().style.color).toBe('red');
    });

    it('renders the trigger alone when disabled', () => {
      renderTooltip({ isDisabled: true });
      focus();
      expect(tip()).toBeNull();
      expect(trigger().getAttribute('aria-describedby')).toBeNull();
    });
  });

  describe('overlay', () => {
    it('is an overlay with role tooltip, above the trigger by default', () => {
      renderTooltip();
      focus();
      expect(tip()?.classList.contains(overlayStyles.overlay ?? '')).toBe(true);
      expect(tip()?.classList.contains(overlayStyles.top ?? '')).toBe(true);
    });

    it('can be placed below', () => {
      renderTooltip({ placement: 'bottom' });
      focus();
      expect(tip()?.classList.contains(overlayStyles.bottom ?? '')).toBe(true);
    });
  });
});
