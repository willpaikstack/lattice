type LatticeMarkIconProps = {
  className?: string;
};

export function LatticeMarkIcon({ className }: LatticeMarkIconProps) {
  return (
    <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center text-stone-950 ${className ?? ""}`}>
      <svg fill="none" height="25" viewBox="0 0 28 28" width="25" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 1.75 26.25 14 14 26.25 1.75 14 14 1.75ZM14 4.25l5.5 5.5-5.5 5.5-5.5-5.5 5.5-5.5ZM4.25 14l5.5-5.5 5.5 5.5-5.5 5.5-5.5-5.5ZM14 12.75l5.5 5.5-5.5 5.5-5.5-5.5 5.5-5.5ZM12.75 14l5.5-5.5 5.5 5.5-5.5 5.5-5.5-5.5Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.25"
        />
      </svg>
    </span>
  );
}

export function LatticeBrand({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LatticeMarkIcon />
      <span className="text-lg font-semibold tracking-[0.025em] text-stone-950">LATTICE</span>
    </span>
  );
}
