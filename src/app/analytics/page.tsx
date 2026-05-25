import Link from "next/link";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Admin</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">Analytics</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Bubble currently exposes the analytics route as a shell-only page. This local surface is reserved for RFQ, quote, supplier, and order metrics once real workflow data is flowing.
        </p>
      </section>

      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">No analytics widgets yet.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Start by creating RFQs and moving them through the operator queue; then this page can report active RFQs, cycle time, supplier response rate, and quote conversion.
        </p>
        <Link className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" href="/operator/requests">
          Open RFQ Queue
        </Link>
      </section>
    </div>
  );
}
