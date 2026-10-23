import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FieldLabel } from './FieldLabel';
import styles from './FieldLabel.module.css';

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
});
