import { createRef } from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { LinkProvider } from '../Link';
import sizes from '../_shared/Size.module.css';
import { Pagination, type PaginationProps } from './Pagination';

afterEach(cleanup);

const renderPages = (props: Partial<PaginationProps> = {}) => {
  const onChange = vi.fn();
  const view = render(<Pagination page={3} pageCount={10} onChange={onChange} {...props} />);
  return { onChange, ...view };
};

const nav = () => screen.getByRole('navigation');
/** The text of the row: a number for a page, "…" for a gap, "‹" and "›" for previous and next. */
const row = () =>
  within(nav())
    .getAllByRole('listitem', { hidden: true })
    .map((li) => li.textContent || (li.querySelector('svg') ? '·' : ''));
const previous = () => screen.getByRole('button', { name: 'Previous page' });
const next = () => screen.getByRole('button', { name: 'Next page' });

describe('Pagination', () => {
  describe('structure', () => {
    it('is a navigation landmark named Pagination, holding a list', () => {
      renderPages();
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();
      expect(within(nav()).getByRole('list').tagName).toBe('OL');
    });

    it('takes another name, and aria-labelledby replaces the default', () => {
      renderPages({ 'aria-label': 'Résultats' });
      expect(screen.getByRole('navigation', { name: 'Résultats' })).toBeTruthy();
      cleanup();
      render(
        <>
          <h2 id="results">Results</h2>
          <Pagination page={1} pageCount={5} onChange={() => {}} aria-labelledby="results" />
        </>,
      );
      expect(nav().hasAttribute('aria-label')).toBe(false);
      expect(screen.getByRole('navigation', { name: 'Results' })).toBeTruthy();
    });

    it('passes other props and the ref to the nav', () => {
      const ref = createRef<HTMLElement>();
      render(
        <Pagination
          ref={ref}
          page={1}
          pageCount={5}
          onChange={() => {}}
          id="pages"
          className="x"
        />,
      );
      expect(ref.current).toBe(nav());
      expect(nav().id).toBe('pages');
      expect(nav().classList.contains('x')).toBe(true);
    });

    it('renders nothing for one page, none, or a count that is not a number', () => {
      for (const pageCount of [1, 0, -3, Number.NaN]) {
        const { container } = renderPages({ pageCount });
        expect(container.firstChild).toBeNull();
        cleanup();
      }
    });
  });

  describe('the row', () => {
    it('shows every page while they fit', () => {
      renderPages({ page: 2, pageCount: 5 });
      expect(row()).toEqual(['·', '1', '2', '3', '4', '5', '·']);
    });

    it('shows the ends, the current page with its neighbours, and gaps', () => {
      renderPages({ page: 10, pageCount: 20 });
      expect(row()).toEqual(['·', '1', '…', '9', '10', '11', '…', '20', '·']);
    });

    it('takes siblingCount and boundaryCount', () => {
      renderPages({ page: 10, pageCount: 30, siblingCount: 2, boundaryCount: 2 });
      expect(row()).toEqual(['·', '1', '2', '…', '8', '9', '10', '11', '12', '…', '29', '30', '·']);
    });

    it('hides the gaps from assistive tech', () => {
      renderPages({ page: 10, pageCount: 20 });
      expect(within(nav()).getAllByRole('listitem')).toHaveLength(7);
    });

    it('names each page, and marks the current one', () => {
      renderPages({ page: 3, pageCount: 5 });
      expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe(
        'page',
      );
      expect(screen.getByRole('button', { name: 'Page 4' }).hasAttribute('aria-current')).toBe(
        false,
      );
    });

    it('puts a page that is out of range on the nearest one', () => {
      renderPages({ page: 99, pageCount: 5 });
      expect(screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current')).toBe(
        'page',
      );
      cleanup();
      renderPages({ page: -4, pageCount: 5 });
      expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe(
        'page',
      );
    });
  });

  describe('buttons', () => {
    it('are buttons, and call onChange with the page pressed', () => {
      const { onChange } = renderPages({ page: 3, pageCount: 10 });
      fireEvent.click(screen.getByRole('button', { name: 'Page 5' }));
      expect(onChange).toHaveBeenCalledWith(5);
    });

    it('goes to the page before and after with previous and next', () => {
      const { onChange } = renderPages({ page: 3, pageCount: 10 });
      fireEvent.click(previous());
      expect(onChange).toHaveBeenLastCalledWith(2);
      fireEvent.click(next());
      expect(onChange).toHaveBeenLastCalledWith(4);
    });

    it('does not call onChange for the page that is already current', () => {
      const { onChange } = renderPages({ page: 3, pageCount: 10 });
      fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not change the page itself: the parent owns it', () => {
      renderPages({ page: 3, pageCount: 10 });
      fireEvent.click(screen.getByRole('button', { name: 'Page 5' }));
      expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe(
        'page',
      );
    });

    it('stops previous on the first page and next on the last, yet leaves them focusable', () => {
      const { onChange } = renderPages({ page: 1, pageCount: 10 });
      expect(previous().getAttribute('aria-disabled')).toBe('true');
      expect((previous() as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(previous());
      expect(onChange).not.toHaveBeenCalled();
      cleanup();
      const last = renderPages({ page: 10, pageCount: 10 });
      expect(next().getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(next());
      expect(last.onChange).not.toHaveBeenCalled();
    });

    it('is all disabled with isDisabled', () => {
      const { onChange } = renderPages({ isDisabled: true });
      for (const button of within(nav()).getAllByRole('button')) {
        expect((button as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(button);
      }
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('links', () => {
    const getHref = (page: number) => `/items?page=${page}`;

    // jsdom can't load a page; stop it trying when a click on a link goes unhandled. On the document,
    // so it runs after React's handlers and they still see the click as not yet prevented.
    const stopNavigation = (event: Event) => event.preventDefault();
    beforeEach(() => document.addEventListener('click', stopNavigation));
    afterEach(() => document.removeEventListener('click', stopNavigation));

    it('are links to the pages when getHref is given', () => {
      renderPages({ page: 3, pageCount: 10, getHref });
      expect(within(nav()).queryAllByRole('button')).toHaveLength(0);
      expect(screen.getByRole('link', { name: 'Page 5' }).getAttribute('href')).toBe(
        '/items?page=5',
      );
      expect(screen.getByRole('link', { name: 'Previous page' }).getAttribute('href')).toBe(
        '/items?page=2',
      );
      expect(screen.getByRole('link', { name: 'Next page' }).getAttribute('href')).toBe(
        '/items?page=4',
      );
    });

    it('marks the current page, which is still a link', () => {
      renderPages({ page: 3, pageCount: 10, getHref });
      const current = screen.getByRole('link', { name: 'Page 3' });
      expect(current.getAttribute('aria-current')).toBe('page');
      expect(current.getAttribute('href')).toBe('/items?page=3');
    });

    it('works with getHref alone, and calls onChange too when both are given', () => {
      const onChange = vi.fn();
      render(<Pagination page={3} pageCount={10} getHref={getHref} onChange={onChange} />);
      const link = screen.getByRole('link', { name: 'Page 5' });
      fireEvent.click(link);
      expect(onChange).toHaveBeenCalledWith(5);
      fireEvent.click(screen.getByRole('link', { name: 'Page 3' }));
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('is not asked for an address beyond the first or last page', () => {
      const first = vi.fn(getHref);
      renderPages({ page: 1, pageCount: 3, getHref: first });
      expect(first).not.toHaveBeenCalledWith(0);
      cleanup();
      const last = vi.fn(getHref);
      renderPages({ page: 3, pageCount: 3, getHref: last });
      expect(last).not.toHaveBeenCalledWith(4);
    });

    it('has no href on previous at the first page, but stays focusable', () => {
      renderPages({ page: 1, pageCount: 10, getHref });
      const link = screen.getByRole('link', { name: 'Previous page' });
      expect(link.hasAttribute('href')).toBe(false);
      expect(link.getAttribute('aria-disabled')).toBe('true');
      expect(link.getAttribute('tabindex')).toBe('0');
    });

    it('is not focusable at all with isDisabled', () => {
      renderPages({ page: 3, pageCount: 10, getHref, isDisabled: true });
      for (const link of within(nav()).getAllByRole('link')) {
        expect(link.hasAttribute('href')).toBe(false);
        expect(link.getAttribute('aria-disabled')).toBe('true');
        expect(link.hasAttribute('tabindex')).toBe(false);
      }
    });

    it('goes to the router under a LinkProvider, with no page load', () => {
      const navigate = vi.fn();
      render(
        <LinkProvider navigate={navigate} resolveHref={(href) => `/app${href}`}>
          <Pagination page={3} pageCount={10} getHref={getHref} />
        </LinkProvider>,
      );
      const link = screen.getByRole('link', { name: 'Page 5' });
      expect(link.getAttribute('href')).toBe('/app/items?page=5');
      expect(fireEvent.click(link)).toBe(false); // preventDefault: the router has it
      expect(navigate).toHaveBeenCalledWith('/items?page=5');
    });

    it('leaves a modified click to the browser', () => {
      const navigate = vi.fn();
      render(
        <LinkProvider navigate={navigate}>
          <Pagination page={3} pageCount={10} getHref={getHref} />
        </LinkProvider>,
      );
      fireEvent.click(screen.getByRole('link', { name: 'Page 5' }), { ctrlKey: true });
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('labels', () => {
    it('names the buttons in another language', () => {
      renderPages({
        page: 3,
        pageCount: 10,
        labels: { previous: 'Précédent', next: 'Suivant', page: (page) => `Page n° ${page}` },
      });
      expect(screen.getByRole('button', { name: 'Précédent' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Suivant' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Page n° 5' })).toBeTruthy();
    });

    it('keeps the English default for each label left out', () => {
      renderPages({ labels: { next: 'Suivant' } });
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Suivant' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Page 4' })).toBeTruthy();
    });
  });

  describe('size', () => {
    it('is normal by default', () => {
      renderPages();
      expect(nav().classList.contains(sizes.sizeNormal!)).toBe(true);
    });

    it('takes a variant, or an escape-hatch value', () => {
      renderPages({ size: 'more' });
      expect(nav().classList.contains(sizes.sizeMore!)).toBe(true);
      cleanup();
      renderPages({ size: '1em' });
      expect(nav().style.fontSize).toBe('1em');
    });
  });
});
