import Link from "next/link";

import { LatticeBrand } from "@/components/lattice-brand";

export function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#f7f6f3]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
        <Link className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2" href="/">
          <LatticeBrand />
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link className="hidden rounded-md text-[15px] font-medium text-stone-800 transition hover:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4 sm:block" href="/login">
            Log in
          </Link>
          <Link className="rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 sm:px-5" href="/waiting-list">
            Request an account
          </Link>
        </div>
      </div>
    </header>
  );
}
