import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#111315] text-white">
      <section className="relative flex min-h-screen overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/equipment/hermle-five-axis-cell.jpg')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[#080a0c]/75" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#111315] to-transparent" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
          <Link className="flex w-fit items-center gap-3" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-white/10 backdrop-blur">
              <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 28 28">
                <path d="M14 2.8 23.8 8.4v11.2L14 25.2 4.2 19.6V8.4L14 2.8Z" fill="#f6f7f8" opacity="0.94" />
                <path d="M14 2.8v11.3l9.8 5.5M14 14.1 4.2 19.6M14 14.1l9.8-5.7M14 14.1 4.2 8.4" fill="none" stroke="#62666d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold uppercase tracking-[0.18em] text-white/80">Lattice</span>
          </Link>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1fr_420px]">
            <div className="max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#cfd6dc]">Invite-only access</p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">Log in</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#d9dee3]">
                Access the private RFQ and procurement workspace for active Lattice teams.
              </p>
            </div>

            <form aria-label="Log in form" action="/dashboard" className="rounded-md border border-white/15 bg-[#171b1f]/90 p-6 shadow-2xl shadow-black/25 backdrop-blur">
              <div>
                <label className="text-[13px] font-semibold text-[#d9dee3]" htmlFor="email">
                  Email
                </label>
                <input
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-md border border-white/15 bg-white/95 px-3 text-[15px] text-[#111315] outline-none transition placeholder:text-[#7d8389] focus:border-white focus:ring-2 focus:ring-white/25"
                  id="email"
                  placeholder="you@company.com"
                  type="email"
                />
              </div>

              <div className="mt-5">
                <label className="text-[13px] font-semibold text-[#d9dee3]" htmlFor="password">
                  Password
                </label>
                <input
                  autoComplete="current-password"
                  className="mt-2 h-12 w-full rounded-md border border-white/15 bg-white/95 px-3 text-[15px] text-[#111315] outline-none transition focus:border-white focus:ring-2 focus:ring-white/25"
                  id="password"
                  type="password"
                />
              </div>

              <button className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-md bg-white px-5 text-[15px] font-semibold text-[#111315] shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-[#d7dde3] hover:shadow-lg hover:shadow-black/25 focus:outline-none focus:ring-2 focus:ring-white/40 active:translate-y-0 active:bg-[#cbd3da]" type="submit">
                Continue
              </button>

              <p className="mt-5 text-center text-[13px] leading-5 text-[#b9c0c7]">
                Need access?{" "}
                <Link className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white" href="/waiting-list">
                  Join the waiting list
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
