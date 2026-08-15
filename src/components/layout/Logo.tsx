/**
 * "DS" monogram crest — a double-ring border (wax-seal / estate-crest style) around
 * a serif monogram, with a small flourish underline. Uses `currentColor` so the
 * wrapping element's text color controls it (works in both light and dark mode).
 */
export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
      <text
        x="50"
        y="61"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="34"
        fontWeight="600"
        letterSpacing="1"
        fill="currentColor"
      >
        DS
      </text>
      <path d="M32 68 Q50 74 68 68" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="50" cy="71.5" r="1.6" fill="currentColor" />
      <line x1="50" y1="4" x2="50" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="50" y1="91" x2="50" y2="96" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
