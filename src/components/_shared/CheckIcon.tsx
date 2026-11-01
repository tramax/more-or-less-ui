// The ✓ of Checkbox, Toggle, Select's options and Chip's selected state. Drawn with attributes, not
// CSS, as CrossIcon is, so each consumer's class only sets size, color and motion. `pathLength` of 1
// makes a dash of 1 the whole tick, which is how Checkbox draws it in.
export const CheckIcon = ({ className }: { className?: string | undefined }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 8.5l3 3 6-7" pathLength={1} />
  </svg>
);
