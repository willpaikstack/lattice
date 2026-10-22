import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import {
  CheckList,
  InviteOnlyLabel,
  PublicSite,
} from "@/components/public-marketing";
import s from "@/components/public-marketing.module.css";
import { joinWaitingListAction } from "./actions";

export const metadata: Metadata = {
  title: "Request access | Lattice",
  description:
    "Request an invitation to Lattice’s manufacturing network for domestic machine shops and small manufacturers.",
};
type WaitingListPageProps = { searchParams?: Promise<{ status?: string }> };

export default async function WaitingListPage({
  searchParams,
}: WaitingListPageProps) {
  const status = (await searchParams)?.status;
  if (status === "joined")
    return (
      <PublicSite>
        <main className={s.container} id="main-content">
          <section className={s.success}>
            <CheckCircle2 aria-hidden="true" size={42} />
            <InviteOnlyLabel>Your next production path</InviteOnlyLabel>
            <h1>Request received</h1>
            <p>
              Thanks for telling us about your shop. We’ll review your request
              and reach out about next steps. Access is by invitation;
              submitting this form doesn’t create an account.
            </p>
            <div className={s.actions}>
              <Link className={s.button} href="/">
                Return to Lattice
              </Link>
              <Link className={s.textLink} href="/how-it-works">
                See how Lattice works <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        </main>
      </PublicSite>
    );
  return (
    <PublicSite>
      <main className={`${s.container} ${s.formLayout}`} id="main-content">
        <div className={s.formIntro}>
          <InviteOnlyLabel>Built for a working relationship</InviteOnlyLabel>
          <h1>
            More capacity starts
            <br />
            with the right fit.
          </h1>
          <p>
            We’re opening Lattice to domestic machine shops and small
            manufacturers by invitation. Share a little about your company and
            the work you want to take on.
          </p>
          <CheckList
            items={[
              "Additional capacity for overflow and repeat work",
              "Supplier coordination from quote through delivery",
              "Manufacturing requirements and quality records together",
            ]}
          />
          <p>
            Want to talk it through first?{" "}
            <Link className="underline underline-offset-4" href="/book-a-call">
              Book a call with us.
            </Link>
          </p>
        </div>
        <section className={s.formPanel}>
          <h2>Request access to Lattice</h2>
          <p>Tell us who you are and where your shop needs support.</p>
          {status === "already-requested" ? (
            <div className={s.notice} role="status">
              <strong>You already requested access.</strong>
              <p>
                That email is already on the Lattice waiting list. We will reach
                out when access opens for your team.
              </p>
            </div>
          ) : null}
          {status === "domain-already-requested" ? (
            <div className={s.notice} role="status">
              <strong>Your company is already represented.</strong>
              <p>
                We sent you an email with the current waitlist contact for your
                company.
              </p>
            </div>
          ) : null}
          <form
            action={joinWaitingListAction}
            aria-label="Waiting list request form"
            className={s.form}
          >
            <label className={s.field} htmlFor="name">
              Full name
              <input
                autoComplete="name"
                id="name"
                maxLength={120}
                name="name"
                placeholder="Alex Morgan"
                required
              />
            </label>
            <label className={s.field} htmlFor="email">
              Work email
              <input
                autoComplete="email"
                id="email"
                maxLength={254}
                name="email"
                placeholder="you@yourshop.com"
                required
                type="email"
              />
            </label>
            <label className={s.field} htmlFor="company">
              Company
              <input
                autoComplete="organization"
                id="company"
                maxLength={180}
                name="company"
                placeholder="Your shop name"
                required
              />
            </label>
            <label className={s.field} htmlFor="procurementNeeds">
              What kind of work do you need support with?
              <textarea
                id="procurementNeeds"
                maxLength={3000}
                name="procurementNeeds"
                placeholder="Tell us about your shop, the parts you make, and where capacity gets tight."
                required
                rows={5}
              />
            </label>
            <AuthSubmitButton
              label="Request access"
              pendingLabel="Sending request…"
            />
            <p className={s.formFinePrint}>
              We’ll use these details to review your request and contact you
              about Lattice. Please keep confidential or export-controlled
              information out of this form.
            </p>
          </form>
        </section>
      </main>
    </PublicSite>
  );
}
