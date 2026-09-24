/** Substituto da foto enquanto ABOUT_PHOTO for null. */
export function Monogram({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label={label} className="h-auto w-full bg-line-dark">
      <text
        x="150"
        y="215"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="140"
        className="fill-bone font-display"
        letterSpacing="-6"
      >
        LCM
      </text>
    </svg>
  );
}
