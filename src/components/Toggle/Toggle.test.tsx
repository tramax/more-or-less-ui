import { createRef, useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import { Toggle } from './Toggle';
import shared from '../_shared/OptionGroup.module.css';

afterEach(cleanup);

const input = () => screen.getByRole('switch') as HTMLInputElement;

describe('Toggle', () => {
  describe('element', () => {
    it('renders a native checkbox input with the switch role, named by its label', () => {
      render(<Toggle label="Dark mode" />);
      expect(input().type).toBe('checkbox');
      expect(screen.getByRole('switch', { name: 'Dark mode' })).toBe(input());
      expect(input().closest('label')?.textContent).toBe('Dark mode');
    });

    it('is named by aria-label, with no visible text, when there is no label', () => {
      const { container } = render(<Toggle aria-label="Dark mode" />);
      expect(screen.getByRole('switch', { name: 'Dark mode' })).toBe(input());
      expect(container.querySelector('label')?.textContent).toBe('');
    });

    it('is named by aria-labelledby', () => {
      render(
        <>
          <span id="name">Dark mode</span>
          <Toggle aria-labelledby="name" />
        </>,
      );
      expect(screen.getByRole('switch', { name: 'Dark mode' })).toBe(input());
    });

    it('forwards the ref and the rest to the input, className and style to the root', () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(
        <Toggle
          ref={ref}
          label="Dark mode"
          id="mine"
          name="theme"
          data-testid="t"
          className="mine"
          style={{ margin: 1 }}
        />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(ref.current).toBe(input());
      expect(input().id).toBe('mine');
      expect(input().name).toBe('theme');
      expect(input().dataset.testid).toBe('t');
      expect(root.classList.contains('mine')).toBe(true);
      expect(root.style.margin).toBe('1px');
      expect(input().classList.contains('mine')).toBe(false);
    });

    it('draws a tick and a cross on the thumb, hidden from assistive technology', () => {
      const { container } = render(<Toggle label="A" />);
      const thumb = container.querySelector('input + span') as HTMLElement;
      expect(thumb.getAttribute('aria-hidden')).toBe('true');
      expect(thumb.querySelectorAll('svg')).toHaveLength(2);
    });

    it('does not use the option row', () => {
      const { container } = render(<Toggle label="A" />);
      expect(container.querySelector(`.${shared.option}`)).toBeNull();
    });

    it('shows the description under the label and points the input at it', () => {
      render(<Toggle label="Dark mode" description="Follows your system by default" />);
      const description = screen.getByText('Follows your system by default');
      expect(input().getAttribute('aria-describedby')).toBe(description.id);
    });

    it('keeps the consumer aria-describedby next to the description', () => {
      render(<Toggle label="Dark mode" description="Hint" aria-describedby="extra" />);
      const description = screen.getByText('Hint');
      expect(input().getAttribute('aria-describedby')).toBe(`extra ${description.id}`);
    });

    it('has no aria-describedby without a description', () => {
      render(<Toggle label="Dark mode" />);
      expect(input().hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('state', () => {
    it('starts off, and on with defaultChecked', () => {
      const { unmount } = render(<Toggle label="A" />);
      expect(input().checked).toBe(false);
      unmount();
      render(<Toggle label="A" defaultChecked />);
      expect(input().checked).toBe(true);
    });

    it('flips on click when uncontrolled', () => {
      render(<Toggle label="A" />);
      fireEvent.click(input());
      expect(input().checked).toBe(true);
      fireEvent.click(input());
      expect(input().checked).toBe(false);
    });

    it('flips when the label text is clicked', () => {
      render(<Toggle label="Dark mode" />);
      fireEvent.click(screen.getByText('Dark mode'));
      expect(input().checked).toBe(true);
    });

    it('calls onChange with the new state', () => {
      const onChange = vi.fn();
      render(<Toggle label="A" onChange={onChange} />);
      fireEvent.click(input());
      fireEvent.click(input());
      expect(onChange.mock.calls).toEqual([[true], [false]]);
    });

    it('shows `checked` and changes only when the parent does (controlled)', () => {
      const onChange = vi.fn();
      render(<Toggle label="A" checked={false} onChange={onChange} />);
      fireEvent.click(input());
      expect(onChange).toHaveBeenCalledWith(true);
      expect(input().checked).toBe(false);
    });

    it('follows a parent that updates `checked`', () => {
      const Parent = () => {
        const [on, setOn] = useState(false);
        return <Toggle label="A" checked={on} onChange={setOn} />;
      };
      render(<Parent />);
      fireEvent.click(input());
      expect(input().checked).toBe(true);
    });
  });

  describe('disabled', () => {
    // Native `disabled` keeps the browser from sending it a click or focus; jsdom would not
    it('sets the native disabled attribute', () => {
      render(<Toggle label="A" isDisabled />);
      expect(input().disabled).toBe(true);
    });
  });

  describe('form', () => {
    const submitted = (form: HTMLFormElement) => [...new FormData(form).entries()];

    it('submits name and `on` while on, and nothing while off', () => {
      const { container } = render(
        <form>
          <Toggle label="A" name="theme" defaultChecked />
        </form>,
      );
      const form = container.firstElementChild as HTMLFormElement;
      expect(submitted(form)).toEqual([['theme', 'on']]);
      fireEvent.click(input());
      expect(submitted(form)).toEqual([]);
    });

    it('submits its value while on', () => {
      const { container } = render(
        <form>
          <Toggle label="A" name="theme" value="dark" defaultChecked />
        </form>,
      );
      expect(submitted(container.firstElementChild as HTMLFormElement)).toEqual([
        ['theme', 'dark'],
      ]);
    });
  });
});
