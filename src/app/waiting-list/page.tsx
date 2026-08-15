import Link from "next/link";
import { CheckCircle2, ClipboardCheck, Diamond, Factory, ShieldCheck } from "lucide-react";

import { AuthSubmitButton } from "@/components/auth-submit-button";

import { joinWaitingListAction } from "./actions";

type WaitingListPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

const accessBenefits = [
  {
    icon: Factory,
    title: "Qualified production capacity",
    description: "CNC machining and fabrication capability matched to the job.",
  },
  {
    icon: ClipboardCheck,
    title: "Managed from quote through delivery",
    description: "Lattice coordinates suppliers, requirements, documentation, and execution.",
  },
  {
    icon: ShieldCheck,
    title: "Quality evidence before shipment",
    description: "Requested inspection reports and material records stay tied to the order.",
  },
] as const;

function BrandMark() {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-950 text-white shadow-sm">
        <Diamond className="fill-white" size={13} />
      </span>
      <span className="text-xl font-semibold tracking-[-0.025em] text-stone-950">Lattice</span>
    </span>
  );
}

function WaitingListHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#fbfaf7]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
        <Link className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2" href="/">
          <BrandMark />
        </Link>

        <nav aria-label="Public navigation" className="flex items-center gap-4 sm:gap-7">
          <Link className="hidden rounded-md text-sm font-medium text-stone-700 transition hover:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4 sm:block" href="/how-it-works">
            How it works
          </Link>
          <Link className="rounded-md text-sm font-medium text-stone-700 transition hover:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4" href="/login">
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}

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

  return null;
}

export default async function WaitingListPage({ searchParams }: WaitingListPageProps) {
  const status = (await searchParams)?.status;
  const message = statusMessage(status);
  const isConfirmed = status === "joined";

  if (isConfirmed) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] font-sans text-stone-950 selection:bg-stone-200">
        <WaitingListHeader />
        <section className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1320px] items-center justify-center px-6 py-16 lg:px-10">
          <div className="w-full max-w-[660px] rounded-xl border border-stone-200 bg-white p-7 shadow-[0_22px_70px_rgba(28,25,23,0.07)] sm:p-12">
            <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-800">
              <CheckCircle2 size={23} strokeWidth={1.8} />
            </span>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Access request</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-[44px]">Request received</h1>
            <p className="mt-5 max-w-xl text-[17px] leading-8 text-stone-600">
              Thanks for telling us about your shop. We&apos;ll review your request and follow up with the next step.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2" href="/">
                Return to Lattice
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-stone-300 px-6 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2" href="/how-it-works">
                See how Lattice works
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] font-sans text-stone-950 selection:bg-stone-200">
      <WaitingListHeader />

      <section className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1320px] items-center gap-12 px-6 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-20 lg:px-10 lg:py-20">
        <div className="max-w-[650px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Invite-only access</p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.045em] text-stone-950 sm:text-[56px]">
            Request access to Lattice
          </h1>
          <p className="mt-6 max-w-[610px] text-[17px] leading-8 text-stone-600 sm:text-lg">
            Lattice helps domestic manufacturers route overflow and out-of-capability work through a qualified global production network. Tell us about your shop and the work you want support with.
          </p>

          <div className="mt-10 border-y border-stone-200">
            {accessBenefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <div className={`grid grid-cols-[44px_1fr] gap-4 py-5 ${index > 0 ? "border-t border-stone-200" : ""}`} key={benefit.title}>
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700">
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h2 className="text-[15px] font-semibold text-stone-950">{benefit.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-stone-600">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-sm leading-6 text-stone-500">Access is currently invite-only. We review each request for fit.</p>
        </div>

        <form aria-label="Waiting list request form" action={joinWaitingListAction} className="rounded-xl border border-stone-200 bg-white p-6 shadow-[0_22px_70px_rgba(28,25,23,0.07)] sm:p-8">
          <div className="border-b border-stone-200 pb-6">
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-stone-950">Tell us about your shop</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">All fields are required.</p>
          </div>

          {message ? (
            <div aria-live="polite" className="mt-6 rounded-lg border border-stone-300 bg-stone-50 p-4" role="status">
              <p className="text-[15px] font-semibold text-stone-950">{message.title}</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">{message.body}</p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-stone-800" htmlFor="name">Full name</label>
              <input autoComplete="name" className="mt-2 h-12 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-[15px] text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10" id="name" name="name" placeholder="Your name" required type="text" />
            </div>

            <div>
              <label className="text-sm font-semibold text-stone-800" htmlFor="email">Work email</label>
              <input autoComplete="email" className="mt-2 h-12 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-[15px] text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10" id="email" name="email" placeholder="you@company.com" required type="email" />
            </div>
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-stone-800" htmlFor="company">Company</label>
            <input autoComplete="organization" className="mt-2 h-12 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-[15px] text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10" id="company" name="company" placeholder="Company name" required type="text" />
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-stone-800" htmlFor="procurement-needs">What kind of work do you need support with?</label>
            <textarea className="mt-2 min-h-32 w-full resize-y rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-[15px] leading-6 text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10" id="procurement-needs" name="procurementNeeds" placeholder="Tell us about the parts, processes, quantities, timing, or capacity constraints you are evaluating." required />
          </div>

          <div className="mt-6">
            <AuthSubmitButton label="Request access" pendingLabel="Requesting access..." />
          </div>

          <p className="mt-5 text-center text-sm leading-6 text-stone-500">
            Already have access?{" "}
            <Link className="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-900" href="/login">Log in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
