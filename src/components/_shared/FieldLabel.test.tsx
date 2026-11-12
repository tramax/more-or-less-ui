import { afterEach, describe, it, expect } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { FieldLabel } from './FieldLabel';
import styles from './FieldLabel.module.css';

afterEach(cleanup);

describe('FieldLabel', () => {
  it('renders a <label> pointing at its input', () => {
    const { container } = render(
      <FieldLabel as="label" htmlFor="in">
        Name
      </FieldLabel>,
    );
    const label = container.querySelector('label');
    expect(label?.getAttribute('for')).toBe('in');
    expect(label?.textContent).toBe('Name');
    expect(label?.classList.contains(styles.label as string)).toBe(true);
  });

  it('renders a <legend> for a group', () => {
    const { container } = render(<FieldLabel as="legend">Colors</FieldLabel>);
    expect(container.querySelector('legend')?.textContent).toBe('Colors');
  });

  it('adds an asterisk hidden from assistive tech when required, and none otherwise', () => {
    const { container, rerender } = render(
      <FieldLabel as="legend" isRequired>
        Colors
      </FieldLabel>,
    );
    expect(container.querySelector(`.${styles.asterisk}`)?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    rerender(<FieldLabel as="legend">Colors</FieldLabel>);
    expect(container.querySelector(`.${styles.asterisk}`)).toBeNull();
  });

  it('adds the caller class next to its own', () => {
    const { container } = render(
      <FieldLabel as="legend" className="extra">
        Colors
      </FieldLabel>,
    );
    expect(container.querySelector('legend')?.classList.contains('extra')).toBe(true);
  });

  describe('tooltip', () => {
    const tip = () => screen.queryByRole('tooltip', { hidden: true });
    const focusHelp = (name: string) =>
      act(() => {
        screen.getByRole('button', { name }).focus();
      });

    it('adds no button without one', () => {
      render(
        <FieldLabel as="label" htmlFor="in">
          Name
        </FieldLabel>,
      );
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('puts a button named for the label beside it, not inside it', () => {
      const { container } = render(
        <FieldLabel as="label" htmlFor="in" tooltip="Your full name">
          Name
        </FieldLabel>,
      );
      const label = container.querySelector('label');
      expect(label?.textContent).toBe('Name');
      expect(label?.getAttribute('for')).toBe('in');
      expect(label?.querySelector('button')).toBeNull();
      expect(screen.getByRole('button', { name: 'About Name' })).toBeTruthy();
    });

    it('shows the text on keyboard focus and describes the button with it', () => {
      render(
        <FieldLabel as="label" htmlFor="in" tooltip="Your full name">
          Name
        </FieldLabel>,
      );
      expect(tip()).toBeNull();
      focusHelp('About Name');
      expect(tip()?.textContent).toBe('Your full name');
      expect(
        screen.getByRole('button', { name: 'About Name' }).getAttribute('aria-describedby'),
      ).toBe(tip()?.id);
    });

    it('keeps the legend, the id on its text and the asterisk', () => {
      const { container } = render(
        <FieldLabel as="legend" id="legend-text" isRequired tooltip="Pick any">
          Colors
        </FieldLabel>,
      );
      const text = container.querySelector('legend #legend-text');
      expect(text?.textContent).toBe('Colors *');
      expect(text?.querySelector(`.${styles.asterisk}`)?.getAttribute('aria-hidden')).toBe('true');
      expect(container.querySelector('legend button')).not.toBeNull();
    });

    it('adds the caller class on the outer element', () => {
      const { container } = render(
        <FieldLabel as="legend" className="extra" tooltip="Pick any">
          Colors
        </FieldLabel>,
      );
      expect(container.querySelector('legend')?.classList.contains('extra')).toBe(true);
    });
  });
});
