import { StrokeIcon } from '../_shared/StrokeIcon';

// The icons of FileUpload: the drop zone's arrow and a failed file's retry button. One consumer, so
// they live here rather than in _shared; drawn on StrokeIcon's shell like the ✓, × and ⌄.
type IconProps = { className?: string | undefined };

/** An arrow up out of a tray: the drop zone */
export const UploadIcon = ({ className }: IconProps) => (
  <StrokeIcon className={className}>
    <path d="M8 10.5V2.5M5 5l3-2.5L11 5M2.5 10.5v3h11v-3" />
  </StrokeIcon>
);

/** An arrow turning back on itself: try the upload again */
export const RetryIcon = ({ className }: IconProps) => (
  <StrokeIcon className={className}>
    <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" />
  </StrokeIcon>
);
