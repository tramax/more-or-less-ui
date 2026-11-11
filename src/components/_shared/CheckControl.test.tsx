import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CheckControl } from './CheckControl';

afterEach(cleanup);

const input = () => screen.getByRole('checkbox') as HTMLInputElement;

describe('CheckControl', () => {
  it('is a native checkbox with a tick drawn after it', () => {
    const { container } = render(<CheckControl aria-label="Agree" />);
    expect(input().type).toBe('checkbox');
    expect(container.querySelector('input + svg')).toBeTruthy();
  });

  it('passes props to the input and className to it, controlClassName to the box around it', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CheckControl
        aria-label="Agree"
        name="agree"
        value="yes"
        checked
        className="on-input"
        controlClassName="on-box"
        onChange={onChange}
      />,
    );
    expect(input().name).toBe('agree');
    expect(input().value).toBe('yes');
    expect(input().checked).toBe(true);
    expect(input().classList.contains('on-input')).toBe(true);
    expect((container.firstElementChild as HTMLElement).classList.contains('on-box')).toBe(true);
    fireEvent.click(input());
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('sets and clears the indeterminate state of the input', () => {
    const { rerender } = render(<CheckControl aria-label="Agree" isIndeterminate />);
    expect(input().indeterminate).toBe(true);
    rerender(<CheckControl aria-label="Agree" isIndeterminate={false} />);
    expect(input().indeterminate).toBe(false);
  });

  it('is not indeterminate by default', () => {
    render(<CheckControl aria-label="Agree" />);
    expect(input().indeterminate).toBe(false);
  });
});
