import shared from './OptionGroup.module.css';

interface OptionTextProps {
  label: string;
  description?: string;
  /** Set on the description, so the input can point at it with aria-describedby. */
  descriptionId?: string;
}

/** The label and the optional description beside an option's control. */
export function OptionText({ label, description, descriptionId }: OptionTextProps) {
  return (
    <span className={shared.text}>
      <span>{label}</span>
      {description && (
        <span id={descriptionId} className={shared.description}>
          {description}
        </span>
      )}
    </span>
  );
}
