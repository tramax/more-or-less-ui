import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IconButton } from './IconButton';
import { CrossIcon } from './CrossIcon';

afterEach(cleanup);

describe('IconButton', () => {
  it('is a button named by its label, with the icon hidden, and calls onClick', () => {
    const onClick = vi.fn();
    render(<IconButton label="Go" icon={CrossIcon} onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Go' }) as HTMLButtonElement;
    expect(button.type).toBe('button');
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled with isDisabled, and can leave the tab order', () => {
    render(<IconButton label="Go" icon={CrossIcon} onClick={vi.fn()} isDisabled tabIndex={-1} />);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.tabIndex).toBe(-1);
  });

  it('passes mousedown to the consumer', () => {
    const onMouseDown = vi.fn();
    render(<IconButton label="Go" icon={CrossIcon} onClick={vi.fn()} onMouseDown={onMouseDown} />);
    fireEvent.mouseDown(screen.getByRole('button'));
    expect(onMouseDown).toHaveBeenCalledTimes(1);
  });

  it('forwards its ref and the other button attributes, so an overlay can use it as a trigger', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton
        ref={ref}
        label="Go"
        icon={CrossIcon}
        onClick={vi.fn()}
        aria-expanded={false}
        aria-haspopup="dialog"
        style={{ color: 'red' }}
        className="mine"
      />,
    );
    const button = screen.getByRole('button');
    expect(ref.current).toBe(button);
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.style.color).toBe('red');
    expect(button.classList.contains('mine')).toBe(true);
  });

  it('gives onClick the event', () => {
    const onClick = vi.fn();
    render(<IconButton label="Go" icon={CrossIcon} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick.mock.calls[0]?.[0]).toHaveProperty('type', 'click');
  });
});
