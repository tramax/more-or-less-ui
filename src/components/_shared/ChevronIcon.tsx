import { StrokeIcon } from './StrokeIcon';

// The ⌄ of Select's field and Collapsible's header: it points down, and the consumer turns it when
// open. Drawn with attributes, not CSS (see StrokeIcon), so a consumer's class only sets size, color
// and motion.
export const ChevronIcon = ({ className }: { className?: string | undefined }) => (
  <StrokeIcon className={className}>
    <path d="M4 6l4 4 4-4" />
  </StrokeIcon>
);
