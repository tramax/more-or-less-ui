import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { Link, type LinkProps } from './Link';
import { LinkProvider } from './LinkProvider';
import styles from './Link.module.css';

afterEach(cleanup);

const link = () => screen.getByRole('link');

// Returns false when a handler called preventDefault, which is how a router takes over. A click
// that is left to the browser would make jsdom try to navigate (not implemented), so the document,
// which sees the click after React, notes whether it was handled and then cancels it.
const click = (init: MouseEventInit = {}) => {
  let isHandled = false;
  const stop = (event: Event) => {
    isHandled = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener('click', stop, { once: true });
  fireEvent.click(link(), { button: 0, cancelable: true, ...init });
  document.removeEventListener('click', stop);
  return !isHandled;
};

const renderLink = (props: Partial<LinkProps> = {}, navigate = vi.fn()) => {
  render(
    <LinkProvider navigate={navigate}>
      <Link href="/about" {...props}>
        About
      </Link>
    </LinkProvider>,
  );
  return navigate;
};

describe('Link', () => {
  describe('structure', () => {
    it('is an anchor with the href, and passes other props and the ref to it', () => {
      const ref = createRef<HTMLAnchorElement>();
      render(
        <Link ref={ref} href="/about" rel="next" data-testid="l">
          About
        </Link>,
      );
      expect(ref.current).toBe(link());
      expect(link().getAttribute('href')).toBe('/about');
      expect(link().getAttribute('rel')).toBe('next');
      expect(link().dataset.testid).toBe('l');
    });

    it('takes the surrounding size unless given one', () => {
      render(<Link href="/a">A</Link>);
      expect(link().className).not.toMatch(/size/i);
      expect(link().style.fontSize).toBe('');
      cleanup();
      render(
        <Link href="/a" size="more">
          A
        </Link>,
      );
      expect(link().className).toMatch(/sizeMore/);
      cleanup();
      render(
        <Link href="/a" size="1.5rem">
          A
        </Link>,
      );
      expect(link().style.fontSize).toBe('1.5rem');
    });

    it('marks the current page, and drops the link color', () => {
      renderLink({ isCurrent: true });
      expect(link().getAttribute('aria-current')).toBe('page');
      expect(link().classList.contains(styles.current!)).toBe(true);
    });

    it('leaves aria-current alone otherwise, and lets a caller set another value', () => {
      renderLink();
      expect(link().hasAttribute('aria-current')).toBe(false);
      cleanup();
      renderLink({ 'aria-current': 'step' });
      expect(link().getAttribute('aria-current')).toBe('step');
    });
  });

  describe('without a LinkProvider', () => {
    it('is a plain anchor: the click is the browser’s and the caller’s onClick runs', () => {
      const onClick = vi.fn();
      render(
        <Link href="/about" onClick={onClick}>
          About
        </Link>,
      );
      expect(click()).toBe(true);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('with a LinkProvider', () => {
    it('goes to the router on a plain click, and the page is not loaded', () => {
      const navigate = renderLink();
      expect(click()).toBe(false);
      expect(navigate).toHaveBeenCalledWith('/about');
    });

    it('calls the caller’s onClick first, and leaves a click it handled alone', () => {
      const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const navigate = renderLink({ onClick });
      click();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
    });

    it.each([
      ['Ctrl', { ctrlKey: true }],
      ['Cmd', { metaKey: true }],
      ['Shift', { shiftKey: true }],
      ['Alt', { altKey: true }],
      ['the middle button', { button: 1 }],
      ['the right button', { button: 2 }],
    ])('leaves a click with %s to the browser', (_, init) => {
      const navigate = renderLink();
      expect(click(init)).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('leaves a link that opens elsewhere, or downloads, to the browser', () => {
      const navigate = renderLink({ target: '_blank' });
      expect(click()).toBe(true);
      cleanup();
      renderLink({ download: '' }, navigate);
      expect(click()).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('still routes a link whose target is _self', () => {
      const navigate = renderLink({ target: '_self' });
      click();
      expect(navigate).toHaveBeenCalledWith('/about');
    });

    it.each([
      'https://example.com/about',
      '//example.com/about',
      'mailto:hi@example.com',
      'tel:+4712345678',
      '#section',
    ])('leaves %s to the browser', (href) => {
      const navigate = renderLink({ href });
      expect(click()).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('routes a link to this site’s own origin, and a relative one', () => {
      const navigate = renderLink({ href: `${window.location.origin}/about?x=1#top` });
      click();
      cleanup();
      renderLink({ href: 'team' }, navigate);
      click();
      expect(navigate.mock.calls.map(([href]) => href)).toEqual([
        `${window.location.origin}/about?x=1#top`,
        'team',
      ]);
    });

    it('writes the resolved href on the anchor and gives the router the unchanged one', () => {
      const navigate = vi.fn();
      render(
        <LinkProvider navigate={navigate} resolveHref={(href) => `/app${href}`}>
          <Link href="/about">About</Link>
        </LinkProvider>,
      );
      expect(link().getAttribute('href')).toBe('/app/about');
      click();
      expect(navigate).toHaveBeenCalledWith('/about');
    });

    it('leaves another site and a fragment as written: resolveHref is only for the app', () => {
      render(
        <LinkProvider navigate={vi.fn()} resolveHref={(href) => `#${href}`}>
          <Link href="https://github.com/org/repo">Elsewhere</Link>
          <Link href="#section">Here</Link>
          <Link href="/about">About</Link>
        </LinkProvider>,
      );
      expect(screen.getByText('Elsewhere').getAttribute('href')).toBe(
        'https://github.com/org/repo',
      );
      expect(screen.getByText('Here').getAttribute('href')).toBe('#section');
      expect(screen.getByText('About').getAttribute('href')).toBe('#/about');
    });

    it('is not routed when there is no href', () => {
      const navigate = vi.fn();
      render(
        <LinkProvider navigate={navigate}>
          <a href="#x" data-testid="plain">
            x
          </a>
          <Link>No href</Link>
        </LinkProvider>,
      );
      const event = createEvent.click(screen.getByText('No href'), { button: 0, cancelable: true });
      fireEvent(screen.getByText('No href'), event);
      expect(event.defaultPrevented).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('isDisabled', () => {
    it('is a disabled link: no href, announced as disabled, and it does nothing', () => {
      const onClick = vi.fn();
      const navigate = renderLink({ isDisabled: true, onClick });
      expect(link().hasAttribute('href')).toBe(false);
      expect(link().getAttribute('aria-disabled')).toBe('true');
      expect(link().classList.contains(styles.disabled!)).toBe(true);
      click();
      expect(onClick).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
