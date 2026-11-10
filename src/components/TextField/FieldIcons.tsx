import { StrokeIcon } from '../_shared/StrokeIcon';

// The icons of TextField's end buttons. One consumer, so they live here rather than in _shared; drawn
// on StrokeIcon's shell like the ✓, × and ⌄.
type IconProps = { className: string | undefined };

const EYE = 'M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z';

/** The password is hidden; pressing shows it */
export const EyeIcon = ({ className }: IconProps) => (
  <StrokeIcon className={className}>
    <path d={EYE} />
    <circle cx="8" cy="8" r="2" />
  </StrokeIcon>
);

/** The password is shown; pressing hides it */
export const EyeOffIcon = ({ className }: IconProps) => (
  <StrokeIcon className={className}>
    <path d={EYE} />
    <path d="M3 13L13 3" />
  </StrokeIcon>
);

export const PlusIcon = ({ className }: IconProps) => (
  <StrokeIcon className={className}>
    <path d="M8 3.5v9M3.5 8h9" />
  </StrokeIcon>
);

export const MinusIcon = ({ className }: IconProps) => (
  <StrokeIcon className={className}>
    <path d="M3.5 8h9" />
  </StrokeIcon>
);
