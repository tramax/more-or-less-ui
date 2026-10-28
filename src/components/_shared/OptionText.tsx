import type { ReactNode } from 'react';
import { OptionIcon } from './OptionIcon';
import shared from './OptionGroup.module.css';

interface OptionTextProps {
  label: string;
  description?: string;
  /** Set on the description, so the input can point at it with aria-describedby. */
  descriptionId?: string;
  /** Shown before the text, on the first line. Only Select has options with one (`SelectOption.icon`). */
  icon?: ReactNode;
}

/** The label and the optional description beside an option's control. */
export function OptionText({ label, description, descriptionId, icon }: OptionTextProps) {
  const text = (
    <span className={shared.text}>
      <span>{label}</span>
      {description && (
        <span id={descriptionId} className={shared.description}>
          {description}
        </span>
      )}
    </span>
  );
  if (icon == null || icon === false) return text;
  return (
    <span className={shared.withIcon}>
      <OptionIcon>{icon}</OptionIcon>
      {text}
    </span>
  );
}
