import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CloseButton } from './CloseButton';

afterEach(cleanup);

describe('CloseButton', () => {
  it('is a button named by its label, and calls onClick', () => {
    const onClick = vi.fn();
    render(<CloseButton label="Close" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('never submits a form', () => {
    render(<CloseButton label="Close" onClick={vi.fn()} />);
    expect((screen.getByRole('button') as HTMLButtonElement).type).toBe('button');
  });

  it('hides the icon from assistive tech', () => {
    render(<CloseButton label="Close" onClick={vi.fn()} />);
    expect(screen.getByRole('button').querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('takes the consumer’s class beside its own', () => {
    render(<CloseButton label="Close" onClick={vi.fn()} className="mine" />);
    expect(screen.getByRole('button').classList.contains('mine')).toBe(true);
  });
});
