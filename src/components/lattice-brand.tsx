import Image from "next/image";

type LatticeMarkIconProps = {
  className?: string;
};

export function LatticeMarkIcon({ className }: LatticeMarkIconProps) {
  return (
    <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center text-stone-950 ${className ?? ""}`}>
      <Image alt="" className="brightness-0" height={25} src="/brand/lattice-mark.svg" width={25} />
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
