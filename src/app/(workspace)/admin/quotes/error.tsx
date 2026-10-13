"use client";
import Link from "next/link";
export default function AdminQuotesError({ reset }: { reset: () => void }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-8"><h1 className="text-2xl font-semibold">Unable to load RFQs</h1><p className="mt-3 text-sm text-slate-600">The customer submission database could not be read. Please try again.</p><div className="mt-5 flex gap-4"><button type="button" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white" onClick={reset}>Try again</button><Link className="px-4 py-2 text-sm font-semibold" href="/admin/quotes">Quote submissions</Link></div></section>;
}
