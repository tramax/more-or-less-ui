import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { LinkProvider } from '../Link';
import sizes from '../_shared/Size.module.css';
import { Breadcrumb, type BreadcrumbProps } from './Breadcrumb';

afterEach(cleanup);

const TRAIL = [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: 'Shoes' }];

const renderTrail = (props: Partial<BreadcrumbProps> = {}) =>
  render(<Breadcrumb items={TRAIL} {...props} />);

const nav = () => screen.getByRole('navigation');
const entries = () => within(nav()).getAllByRole('listitem');

describe('Breadcrumb', () => {
  describe('structure', () => {
    it('is a navigation landmark named Breadcrumb, holding a list in order', () => {
      renderTrail();
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
      expect(within(nav()).getByRole('list').tagName).toBe('OL');
      expect(entries().map((li) => li.textContent)).toEqual(['Home', 'Shop', 'Shoes']);
    });

    it('takes another name, and aria-labelledby replaces the default', () => {
      renderTrail({ 'aria-label': 'Fil d’Ariane' });
      expect(screen.getByRole('navigation', { name: 'Fil d’Ariane' })).toBeTruthy();
      cleanup();
      render(
        <>
          <h2 id="where">You are here</h2>
          <Breadcrumb items={TRAIL} aria-labelledby="where" />
        </>,
      );
      expect(nav().hasAttribute('aria-label')).toBe(false);
      expect(screen.getByRole('navigation', { name: 'You are here' })).toBeTruthy();
    });

    it('passes other props and the ref to the nav', () => {
      const ref = createRef<HTMLElement>();
      render(<Breadcrumb ref={ref} items={TRAIL} id="trail" className="extra" />);
      expect(ref.current).toBe(nav());
      expect(nav().id).toBe('trail');
      expect(nav().classList.contains('extra')).toBe(true);
    });

    it('renders nothing for an empty trail', () => {
      const { container } = render(<Breadcrumb items={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('items', () => {
    it('makes an item with an href a link to it', () => {
      renderTrail();
      expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
      expect(screen.getByRole('link', { name: 'Shop' }).getAttribute('href')).toBe('/shop');
    });

    it('marks the last item as the current page; with no href it is text, not a link', () => {
      renderTrail();
      expect(screen.queryByRole('link', { name: 'Shoes' })).toBeNull();
      expect(screen.getByText('Shoes').getAttribute('aria-current')).toBe('page');
      expect(screen.getByRole('link', { name: 'Shop' }).hasAttribute('aria-current')).toBe(false);
    });

    it('keeps a current page with an href as a link marked current', () => {
      renderTrail({
        items: [
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
        ],
      });
      const current = screen.getByRole('link', { name: 'Shop' });
      expect(current.getAttribute('aria-current')).toBe('page');
      expect(screen.getByRole('link', { name: 'Home' }).hasAttribute('aria-current')).toBe(false);
    });

    it('shows a level before the end with no href as plain text, not marked current', () => {
      renderTrail({ items: [{ label: 'Archive' }, { label: 'Shoes' }] });
      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.getByText('Archive').hasAttribute('aria-current')).toBe(false);
      expect(screen.getByText('Shoes').getAttribute('aria-current')).toBe('page');
    });

    it('is one item that is the current page, with no separator', () => {
      const { container } = renderTrail({ items: [{ label: 'Home' }] });
      expect(entries()).toHaveLength(1);
      expect(container.querySelectorAll('svg')).toHaveLength(0);
    });
  });

  describe('separators', () => {
    it('puts one between each pair of items, hidden from assistive tech', () => {
      const { container } = renderTrail();
      const separators = container.querySelectorAll('svg');
      expect(separators).toHaveLength(2);
      separators.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'));
      expect(entries().at(-1)?.querySelector('svg')).toBeNull();
    });
  });

  describe('size', () => {
    it('is normal unless given another', () => {
      renderTrail();
      expect(nav().classList.contains(sizes.sizeNormal!)).toBe(true);
      cleanup();
      renderTrail({ size: 'more' });
      expect(nav().classList.contains(sizes.sizeMore!)).toBe(true);
    });

    it('takes an escape-hatch value as font-size', () => {
      renderTrail({ size: '1em' });
      expect(nav().style.fontSize).toBe('1em');
    });
  });

  describe('with a LinkProvider', () => {
    it('sends a click on a level to the router', () => {
      const navigate = vi.fn();
      render(
        <LinkProvider navigate={navigate}>
          <Breadcrumb items={TRAIL} />
        </LinkProvider>,
      );
      const click = (name: string) =>
        fireEvent.click(screen.getByRole('link', { name }), { button: 0, cancelable: true });
      expect(click('Shop')).toBe(false);
      expect(navigate).toHaveBeenCalledWith('/shop');
    });
  });
});
