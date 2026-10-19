import { requirePageRole } from "@/lib/route-authorization";
import { CustomerOnboardingDraft } from "@/components/customer-onboarding-draft";
import Link from "next/link";

export default async function CustomerOnboardingPreviewPage() {
  await requirePageRole(["admin"]);
  return <><section className="mb-7 rounded-xl border border-stone-200 bg-white p-7"><p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Customer workspace tour</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Walk through the app itself.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">The introduction guides customers through the real Request Quote, Quotes, Orders and Help screens after password setup. Preview it in the customer workspace with your admin account.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-stone-800 px-4 text-sm font-semibold text-white" href="/dashboard?tour=preview">Preview in customer workspace</Link><p className="mt-3 text-xs text-stone-500">Admin preview does not save customer tour progress.</p></section><details className="rounded-xl border border-stone-200 bg-white p-5"><summary className="cursor-pointer text-sm font-medium text-stone-600">Earlier onboarding design reference</summary><div className="mt-6"><CustomerOnboardingDraft /></div></details></>;
}
