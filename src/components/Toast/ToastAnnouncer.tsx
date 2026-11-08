import { VisuallyHidden } from '../_shared/VisuallyHidden';

export interface Announcement {
  text: string;
  /** Changes with every announcement, so the same words twice are read twice */
  count: number;
}

export const NO_ANNOUNCEMENT: Announcement = { text: '', count: 0 };

/**
 * The toasts, read out. Two live regions that stay mounted while the provider is, one polite and one
 * assertive, with the text put into them when a toast shows. The `key` replaces the text node, which is
 * what makes a screen reader read a message that is the same as the last one.
 */
export function ToastAnnouncer({
  polite,
  assertive,
}: {
  polite: Announcement;
  assertive: Announcement;
}) {
  return (
    <>
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        <span key={polite.count}>{polite.text}</span>
      </VisuallyHidden>
      <VisuallyHidden role="alert" aria-live="assertive" aria-atomic="true">
        <span key={assertive.count}>{assertive.text}</span>
      </VisuallyHidden>
    </>
  );
}
