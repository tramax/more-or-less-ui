import { StrokeIcon } from './StrokeIcon';

// The × of Chip's remove button, Select's clear button and CloseButton (Banner's dismiss, Dialog's
// close). Drawn with attributes, not CSS, so each consumer's class only sets size and motion.
export const CrossIcon = ({ className }: { className: string | undefined }) => (
  <StrokeIcon className={className}>
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </StrokeIcon>
);
