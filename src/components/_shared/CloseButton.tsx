import { CrossIcon } from './CrossIcon';
import { IconButton } from './IconButton';

/**
 * The round × button of Banner's dismiss, Toast's and Dialog's close: an `IconButton` with the ×. It
 * is in the tab order, named by `label`. Spacing and alignment go through `className`.
 */
export function CloseButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return <IconButton label={label} icon={CrossIcon} onClick={onClick} className={className} />;
}
