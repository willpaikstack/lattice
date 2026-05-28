import Link from "next/link";

import { joinWaitingListAction } from "./actions";

type WaitingListPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

function statusMessage(status?: string) {
  if (status === "already-requested") {
    return {
      title: "You already requested access.",
      body: "That email is already on the Lattice waiting list. We will reach out when access opens for your team.",
    };
  }

  if (status === "domain-already-requested") {
    return {
      title: "Your company is already represented.",
      body: "We sent you an email with the current waitlist contact for your company.",
    };
  }

  if (status === "joined") {
    return {
      title: "You are on the waiting list.",
      body: "Thanks for requesting access. We sent a confirmation email with the next step.",
    };
  }

  return null;
}

export default async function WaitingListPage({ searchParams }: WaitingListPageProps) {
  const message = statusMessage((await searchParams)?.status);

  return (
    <main className="min-h-screen bg-[#111315] text-white">
      <section className="relative flex min-h-screen overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/equipment/hermle-five-axis-cell.jpg')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[#080a0c]/76" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#111315] to-transparent" />

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

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1fr_460px]">
            <div className="max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#cfd6dc]">Waiting list request</p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
                Request access to Lattice
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#d9dee3]">
                Tell us who you are and what kind of manufacturing procurement work you want to bring into the workspace.
              </p>
            </div>

            <form
              aria-label="Waiting list request form"
              action={joinWaitingListAction}
              className="rounded-md border border-white/15 bg-[#171b1f]/90 p-6 shadow-2xl shadow-black/25 backdrop-blur"
            >
              {message ? (
                <div className="mb-5 rounded-md border border-white/15 bg-white/10 p-4">
                  <p className="text-[15px] font-semibold text-white">{message.title}</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#d9dee3]">{message.body}</p>
                </div>
              ) : null}

              <div>
                <label className="text-[13px] font-semibold text-[#d9dee3]" htmlFor="name">
                  Name
                </label>
                <input
                  autoComplete="name"
                  className="mt-2 h-12 w-full rounded-md border border-white/15 bg-white/95 px-3 text-[15px] text-[#111315] outline-none transition placeholder:text-[#7d8389] focus:border-white focus:ring-2 focus:ring-white/25"
                  id="name"
                  name="name"
                  placeholder="Your name"
                  required
                  type="text"
                />
              </div>

              <div className="mt-5">
                <label className="text-[13px] font-semibold text-[#d9dee3]" htmlFor="email">
                  Work email
                </label>
                <input
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-md border border-white/15 bg-white/95 px-3 text-[15px] text-[#111315] outline-none transition placeholder:text-[#7d8389] focus:border-white focus:ring-2 focus:ring-white/25"
                  id="email"
                  name="email"
                  placeholder="you@company.com"
                  required
                  type="email"
                />
              </div>

              <div className="mt-5">
                <label className="text-[13px] font-semibold text-[#d9dee3]" htmlFor="company">
                  Company
                </label>
                <input
                  autoComplete="organization"
                  className="mt-2 h-12 w-full rounded-md border border-white/15 bg-white/95 px-3 text-[15px] text-[#111315] outline-none transition placeholder:text-[#7d8389] focus:border-white focus:ring-2 focus:ring-white/25"
                  id="company"
                  name="company"
                  placeholder="Company name"
                  required
                  type="text"
                />
              </div>

              <div className="mt-5">
                <label className="text-[13px] font-semibold text-[#d9dee3]" htmlFor="procurement-needs">
                  Procurement needs
                </label>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-md border border-white/15 bg-white/95 px-3 py-3 text-[15px] text-[#111315] outline-none transition placeholder:text-[#7d8389] focus:border-white focus:ring-2 focus:ring-white/25"
                  id="procurement-needs"
                  name="procurementNeeds"
                  placeholder="RFQs, production orders, supplier follow-up, materials, or parts you source."
                  required
                />
              </div>

              <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-white px-5 text-[15px] font-semibold text-[#111315] transition hover:bg-[#e8ecef]" type="submit">
                Submit request
              </button>

              <p className="mt-5 text-center text-[13px] leading-5 text-[#b9c0c7]">
                Already have access?{" "}
                <Link className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white" href="/login">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
