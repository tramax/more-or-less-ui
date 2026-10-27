// The × of a chip's remove button and of the field's clear button. Drawn with attributes, not CSS,
// so each consumer's class only sets size and motion.
export const CrossIcon = ({ className }: { className: string | undefined }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
  >
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </svg>
);
