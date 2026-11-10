import { CrossIcon } from './CrossIcon';
import { IconButton } from './IconButton';

/**
 * The round × button of Banner's dismiss, Toast's and Dialog's close: an `IconButton` with the ×. It
 * is in the tab order, named by `label`. Spacing and alignment go through `className`.
 */
export function CloseButton({
  label,
  onClick,
  isDisabled,
  className,
}: {
  label: string;
  onClick: () => void;
  /** Native `disabled` (FileUpload's remove button in a disabled field). */
  isDisabled?: boolean;
  className?: string;
}) {
  return (
    <IconButton
      label={label}
      icon={CrossIcon}
      onClick={onClick}
      {...(isDisabled !== undefined && { isDisabled })}
      className={className}
    />
  );
}
