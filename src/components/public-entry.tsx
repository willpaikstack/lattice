import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <Link className="flex min-h-9 w-fit items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 shadow-sm">
            <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2L14 8L8 14L2 8L8 2Z" fill="white" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-normal text-stone-900">Lattice</span>
        </Link>
      </div>
    </header>
  );
}

export function TechnicalBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:100px_100px]" />

      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,0.15) 60px, rgba(255,255,255,0.15) 61px)",
            "repeating-linear-gradient(-45deg, transparent, transparent 60px, rgba(255,255,255,0.15) 60px, rgba(255,255,255,0.15) 61px)",
          ].join(", "),
        }}
      />

      <div className="absolute left-1/4 top-1/3 h-32 w-32 opacity-10">
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
      </div>

      <div className="absolute right-1/4 bottom-1/4 h-24 w-24 opacity-10">
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
      </div>

      <div className="absolute bottom-1/4 left-1/3 h-40 w-40 opacity-5">
        <div className="absolute inset-0 rounded-full border-2 border-white" />
        <div className="absolute inset-4 rounded-full border border-white" />
        <div className="absolute inset-8 rounded-full border border-white" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
      </div>

      <div className="absolute left-10 top-20 w-48 opacity-10">
        <div className="flex items-center gap-2">
          <div className="h-px w-2 bg-white" />
          <div className="h-px flex-1 bg-white" />
          <div className="h-px w-2 bg-white" />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[8px] text-white">
          <span>|</span>
          <span>|</span>
        </div>
      </div>

      <div className="absolute bottom-20 right-10 h-32 opacity-10">
        <div className="flex h-full flex-col items-center gap-2">
          <div className="h-2 w-px bg-white" />
          <div className="w-px flex-1 bg-white" />
          <div className="h-2 w-px bg-white" />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/60 via-stone-800/40 to-stone-900/60" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-stone-800/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
