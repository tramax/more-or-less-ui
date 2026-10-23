import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FieldError } from './FieldError';
import styles from './FieldError.module.css';

describe('FieldError', () => {
  it('renders the message with the given id', () => {
    const { container } = render(<FieldError id="e1">Enter your name</FieldError>);
    const message = container.querySelector(`.${styles.error}`);
    expect(message?.id).toBe('e1');
    expect(message?.textContent).toBe('Enter your name');
  });

  it('hides the icon from assistive tech, so the text carries the message', () => {
    const { container } = render(<FieldError id="e1">Oops</FieldError>);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('adds the caller class next to its own', () => {
    const { container } = render(
      <FieldError id="e1" className="extra">
        Oops
      </FieldError>,
    );
    const message = container.querySelector('p');
    expect(message?.classList.contains(styles.error as string)).toBe(true);
    expect(message?.classList.contains('extra')).toBe(true);
  });
});
