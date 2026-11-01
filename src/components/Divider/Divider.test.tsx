import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Divider } from './Divider';
import styles from './Divider.module.css';

const renderDivider = (props: ComponentProps<typeof Divider> = {}) => {
  const { container } = render(<Divider {...props} />);
  return container.firstElementChild as HTMLHRElement;
};

afterEach(cleanup);

describe('Divider', () => {
  describe('element', () => {
    it('renders an hr with the divider class', () => {
      const el = renderDivider();
      expect(el.tagName).toBe('HR');
      expect(el.classList.contains(styles.divider as string)).toBe(true);
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLHRElement>();
      render(<Divider ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLHRElement);
    });

    it('passes DOM attributes through, and merges className and style', () => {
      const el = renderDivider({ id: 'd', className: 'extra', style: { margin: '4px' } });
      expect(el.id).toBe('d');
      expect(el.classList.contains('extra')).toBe(true);
      expect(el.classList.contains(styles.divider as string)).toBe(true);
      expect(el.style.margin).toBe('4px');
    });
  });

  describe('orientation', () => {
    it('is horizontal by default, with no aria-orientation (an hr already is)', () => {
      const el = renderDivider();
      expect(el.classList.contains(styles.horizontal as string)).toBe(true);
      expect(el.classList.contains(styles.vertical as string)).toBe(false);
      expect(el.hasAttribute('aria-orientation')).toBe(false);
      expect(el.hasAttribute('orientation')).toBe(false);
    });

    it('vertical adds its class and aria-orientation', () => {
      const el = renderDivider({ orientation: 'vertical' });
      expect(el.classList.contains(styles.vertical as string)).toBe(true);
      expect(el.classList.contains(styles.horizontal as string)).toBe(false);
      expect(el.getAttribute('aria-orientation')).toBe('vertical');
    });
  });

  describe('accessibility', () => {
    it('is a separator', () => {
      render(<Divider />);
      expect(screen.getByRole('separator')).toBeTruthy();
    });

    it('is a vertical separator when vertical', () => {
      render(<Divider orientation="vertical" />);
      expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical');
    });
  });
});
