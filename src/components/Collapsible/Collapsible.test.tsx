import { createRef, useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Collapsible, type CollapsibleProps } from './Collapsible';
import styles from './Collapsible.module.css';

const renderCollapsible = (props: Partial<CollapsibleProps> = {}) =>
  render(
    <Collapsible title="Details" {...props}>
      <p>The details</p>
    </Collapsible>,
  );

const header = () => screen.getByRole('button', { name: 'Details' });

afterEach(cleanup);

describe('Collapsible', () => {
  describe('structure', () => {
    it('is a button named by the title, with the content kept in the document', () => {
      renderCollapsible();
      expect(header().textContent).toBe('Details');
      expect(screen.getByText('The details')).toBeTruthy();
    });

    it('links the button to the content, closed or open', () => {
      renderCollapsible();
      const panel = screen.getByText('The details').closest(`.${styles.panel}`);
      expect(panel?.id).toBeTruthy();
      expect(header().getAttribute('aria-controls')).toBe(panel?.id);
    });

    it('reports closed, and open', () => {
      renderCollapsible();
      expect(header().getAttribute('aria-expanded')).toBe('false');
      expect(header().closest('[data-state]')?.getAttribute('data-state')).toBe('closed');
      cleanup();
      renderCollapsible({ isOpen: true });
      expect(header().getAttribute('aria-expanded')).toBe('true');
      expect(header().closest('[data-state]')?.getAttribute('data-state')).toBe('open');
    });

    it('takes an id from the root for the content, and passes other props and the ref to it', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Collapsible ref={ref} title="Details" id="c" data-testid="root">
          Body
        </Collapsible>,
      );
      expect(ref.current?.dataset.testid).toBe('root');
      expect(header().getAttribute('aria-controls')).toBe('c-panel');
    });

    it('accepts a node for the title', () => {
      render(<Collapsible title={<strong>Bold</strong>}>Body</Collapsible>);
      expect(screen.getByRole('button', { name: 'Bold' })).toBeTruthy();
    });

    it('shows an icon, hidden from assistive tech, and keeps the title as the name', () => {
      renderCollapsible({ icon: <svg data-testid="icon" /> });
      expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).toBeTruthy();
      expect(header()).toBeTruthy();
    });

    it('draws the chevron decoratively', () => {
      renderCollapsible();
      expect(header().querySelector(`svg.${styles.chevron}`)?.getAttribute('aria-hidden')).toBe(
        'true',
      );
    });
  });

  describe('uncontrolled', () => {
    it('starts closed, and open with defaultIsOpen', () => {
      renderCollapsible();
      expect(header().getAttribute('aria-expanded')).toBe('false');
      cleanup();
      renderCollapsible({ defaultIsOpen: true });
      expect(header().getAttribute('aria-expanded')).toBe('true');
    });

    it('opens and closes itself when the header is pressed, and says so', () => {
      const onOpenChange = vi.fn();
      renderCollapsible({ onOpenChange });
      fireEvent.click(header());
      expect(header().getAttribute('aria-expanded')).toBe('true');
      fireEvent.click(header());
      expect(header().getAttribute('aria-expanded')).toBe('false');
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    });

    it('needs no handler', () => {
      renderCollapsible();
      expect(() => fireEvent.click(header())).not.toThrow();
    });

    it('keeps what is inside mounted while closed, so its state survives', () => {
      render(
        <Collapsible title="Details" defaultIsOpen>
          <input aria-label="Note" />
        </Collapsible>,
      );
      fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'kept' } });
      fireEvent.click(header());
      fireEvent.click(header());
      expect((screen.getByLabelText('Note') as HTMLInputElement).value).toBe('kept');
    });
  });

  describe('controlled', () => {
    it('asks to open or close, and changes nothing until the parent says so', () => {
      const onOpenChange = vi.fn();
      renderCollapsible({ isOpen: false, onOpenChange });
      fireEvent.click(header());
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
      expect(header().getAttribute('aria-expanded')).toBe('false');
    });

    it('follows the parent', () => {
      const Parent = () => {
        const [isOpen, setIsOpen] = useState(true);
        return (
          <Collapsible title="Details" isOpen={isOpen} onOpenChange={setIsOpen}>
            Body
          </Collapsible>
        );
      };
      render(<Parent />);
      fireEvent.click(header());
      expect(header().getAttribute('aria-expanded')).toBe('false');
    });

    it('wins over defaultIsOpen', () => {
      renderCollapsible({ isOpen: false, defaultIsOpen: true });
      expect(header().getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('disabled', () => {
    it('is a disabled button that asks for nothing', () => {
      const onOpenChange = vi.fn();
      renderCollapsible({ isDisabled: true, defaultIsOpen: true, onOpenChange });
      expect((header() as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(header());
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(header().getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('size', () => {
    it('is normal by default', () => {
      renderCollapsible({ 'data-testid': 'root' } as Partial<CollapsibleProps>);
      expect(screen.getByTestId('root').className).toMatch(/sizeNormal/);
    });

    it('takes a variant as a class, and an escape-hatch value as a style', () => {
      renderCollapsible({ size: 'more', 'data-testid': 'root' } as Partial<CollapsibleProps>);
      expect(screen.getByTestId('root').className).toMatch(/sizeMore/);
      cleanup();
      renderCollapsible({ size: '1em', 'data-testid': 'root' } as Partial<CollapsibleProps>);
      expect(screen.getByTestId('root').style.fontSize).toBe('1em');
    });

    it('keeps the consumer className and style', () => {
      renderCollapsible({
        className: 'mine',
        style: { margin: 4 },
        'data-testid': 'root',
      } as Partial<CollapsibleProps>);
      const root = screen.getByTestId('root');
      expect(root.className).toMatch(/mine/);
      expect(root.style.margin).toBe('4px');
    });
  });
});
