import { StrokeIcon } from './StrokeIcon';

// The ⓘ of FieldLabel's tooltip button. Drawn with attributes, not CSS, like the other stroke icons.
export const InfoIcon = ({ className }: { className: string | undefined }) => (
  <StrokeIcon className={className}>
    <circle cx="8" cy="8" r="6.5" />
    {/* A zero-length round-capped line is the dot */}
    <path d="M8 7.5v3.5M8 5v.01" />
  </StrokeIcon>
);
