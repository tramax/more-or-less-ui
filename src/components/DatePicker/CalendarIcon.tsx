import { StrokeIcon } from '../_shared/StrokeIcon';

// The calendar button of DatePicker's field: a page with its two rings and a rule under the header.
// Drawn with attributes on StrokeIcon's shell, as the others, so a consumer's class sets only size.
export const CalendarIcon = ({ className }: { className: string | undefined }) => (
  <StrokeIcon className={className}>
    <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
    <path d="M2.5 7h11M5.5 2v3M10.5 2v3" />
  </StrokeIcon>
);
