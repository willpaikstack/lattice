import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#111315] text-white">
      <section className="relative flex min-h-screen overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/equipment/hermle-five-axis-cell.jpg')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[#080a0c]/70" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#111315] to-transparent" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-white/10 backdrop-blur">
                <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 28 28">
                  <path d="M14 2.8 23.8 8.4v11.2L14 25.2 4.2 19.6V8.4L14 2.8Z" fill="#f6f7f8" opacity="0.94" />
                  <path d="M14 2.8v11.3l9.8 5.5M14 14.1 4.2 19.6M14 14.1l9.8-5.7M14 14.1 4.2 8.4" fill="none" stroke="#62666d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold uppercase tracking-[0.18em] text-white/80">Lattice</span>
            </div>
          </div>

          <div className="flex flex-1 items-end pb-16 pt-24 sm:pb-20 lg:pb-24">
            <div className="max-w-3xl">
              <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#cfd6dc]">Invite-only manufacturing procurement</p>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.96] tracking-normal text-white sm:text-6xl lg:text-7xl">
                Lattice
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d9dee3] sm:text-xl">
                A private RFQ and procurement workspace for teams moving from drawings to quotes, supplier follow-up, and production orders.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 bg-[#2a2f33]/70 px-5 text-[15px] font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-[#343a3f]/80"
                  href="/login"
                >
                  Log in
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/35 bg-white/10 px-5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  href="/waiting-list"
                >
                  Join waiting list
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
