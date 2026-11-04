import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Drawer, type DrawerProps } from './Drawer';
import overlayStyles from '../_shared/Overlay.module.css';
import frameStyles from '../_shared/ModalFrame.module.css';
import styles from './Drawer.module.css';

// The behavior it shares with Dialog (focus, Escape, the trigger, the name) is tested in Dialog.test.tsx,
// through _shared/ModalFrame. Here: what is Drawer's own.
const renderDrawer = (props: Partial<DrawerProps> = {}) =>
  render(
    <Drawer title="Filters" trigger={<button type="button">Filter</button>} {...props}>
      <button type="button">Apply</button>
    </Drawer>,
  );

const trigger = () => screen.getByRole('button', { name: 'Filter' });
// jsdom has no showModal, so the <dialog> is never `open` and is hidden from the role queries
const drawer = () => document.querySelector('dialog');
const classes = (module: Record<string, string | undefined>, ...names: string[]) =>
  names.map((name) => drawer()?.classList.contains(module[name] ?? '') ?? false);

afterEach(cleanup);

describe('Drawer', () => {
  it('opens from the trigger as a modal dialog, and closes on Escape and the backdrop', () => {
    renderDrawer();
    expect(drawer()).toBeNull();
    fireEvent.click(trigger());
    expect(drawer()?.getAttribute('role')).toBe('dialog');
    expect(drawer()?.getAttribute('aria-modal')).toBe('true');
    expect(drawer()?.dataset.state).toBe('open');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(drawer()?.dataset.state).toBe('closed');
    fireEvent.click(trigger());
    fireEvent.pointerDown(drawer()!);
    fireEvent.click(drawer()!);
    expect(drawer()?.dataset.state).toBe('closed');
  });

  it('is on the overlay and slides, not anchored and not the centred Dialog’s grow', () => {
    renderDrawer({ defaultIsOpen: true });
    expect(classes(overlayStyles, 'overlay', 'modal', 'slideEnd', 'anchored')).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('is docked to the end by default, and to the edge it is given', () => {
    const edges = ['start', 'end', 'top', 'bottom'] as const;
    for (const placement of edges) {
      cleanup();
      renderDrawer({ defaultIsOpen: true, placement });
      const slide = `slide${placement[0]!.toUpperCase()}${placement.slice(1)}`;
      expect(classes(styles, placement)).toEqual([true]);
      expect(classes(overlayStyles, slide)).toEqual([true]);
      expect(edges.filter((other) => classes(styles, other)[0])).toEqual([placement]);
    }
    cleanup();
    renderDrawer({ defaultIsOpen: true });
    expect(classes(styles, 'end')).toEqual([true]);
  });

  it('veils the page behind it by default, and can leave it as it is', () => {
    renderDrawer({ defaultIsOpen: true });
    expect(classes(frameStyles, 'backdropHidden')).toEqual([false]);
    cleanup();
    renderDrawer({ defaultIsOpen: true, isBackdropShown: false });
    expect(classes(frameStyles, 'backdropHidden')).toEqual([true]);
  });

  it('is still a modal with no backdrop shown, and a press there still closes it', () => {
    renderDrawer({ isBackdropShown: false });
    fireEvent.click(trigger());
    expect(drawer()?.getAttribute('aria-modal')).toBe('true');
    fireEvent.pointerDown(drawer()!);
    fireEvent.click(drawer()!);
    expect(drawer()?.dataset.state).toBe('closed');
    cleanup();
    renderDrawer({ isBackdropShown: false, isBackdropClosing: false });
    fireEvent.click(trigger());
    fireEvent.pointerDown(drawer()!);
    fireEvent.click(drawer()!);
    expect(drawer()?.dataset.state).toBe('open');
  });

  it('is named by its title, and keeps the × and the actions', () => {
    renderDrawer({ defaultIsOpen: true, actions: <button type="button">Done</button> });
    const heading = screen.getByRole('heading', { name: 'Filters', hidden: true });
    expect(drawer()?.getAttribute('aria-labelledby')).toBe(heading.id);
    const buttons = screen
      .getAllByRole('button', { hidden: true })
      .map((b) => b.getAttribute('aria-label') ?? b.textContent);
    expect(buttons.slice(1, 4)).toEqual(['Close', 'Apply', 'Done']);
  });

  it('can be named without a title, and the backdrop and × can be turned off', () => {
    render(
      <Drawer
        aria-label="Navigation"
        isBackdropClosing={false}
        isCloseButtonShown={false}
        defaultIsOpen
      >
        <a href="/">Home</a>
      </Drawer>,
    );
    expect(drawer()?.getAttribute('aria-label')).toBe('Navigation');
    expect(screen.queryByRole('button', { hidden: true })).toBeNull();
    fireEvent.pointerDown(drawer()!);
    fireEvent.click(drawer()!);
    expect(drawer()?.dataset.state).toBe('open');
  });
});
