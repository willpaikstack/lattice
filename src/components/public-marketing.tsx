import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { LatticeBrand } from "./lattice-brand";
import { PublicSiteHeader } from "./public-site-header";
import s from "./public-marketing.module.css";

export function PublicSiteFooter() {
  return (
    <footer className={`${s.footer} ${s.container}`}>
      <div className={s.footerTop}>
        <div>
          <Link aria-label="Lattice home" href="/">
            <LatticeBrand />
          </Link>
          <p>More capacity. Still your customer.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/waiting-list">Request access</Link>
          <Link href="/book-a-call">Book a call</Link>
          <Link href="/login">Log in</Link>
        </nav>
      </div>
      <div className={s.footerBottom}>
        <span>
          © Lattice OS. Manufacturing capacity, thoughtfully connected.
        </span>
        <a href="mailto:support@latticeos.co">support@latticeos.co</a>
        <span>Access by invitation.</span>
      </div>
    </footer>
  );
}
export function PublicSite({ children }: { children: ReactNode }) {
  return (
    <div className={s.site}>
      <PublicSiteHeader />
      {children}
      <PublicSiteFooter />
    </div>
  );
}
export function InviteOnlyLabel({
  children = "An invite-only manufacturing network",
}: {
  children?: ReactNode;
}) {
  return (
    <p className={s.eyebrow}>
      <span aria-hidden="true" className={s.statusDot} />
      {children}
    </p>
  );
}
export function BookCallLink({
  children = "Book a call",
}: {
  children?: ReactNode;
}) {
  return (
    <Link className={s.button} href="/book-a-call">
      {children}
      <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  );
}
export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className={s.checkList}>
      {items.map((item) => (
        <li key={item}>
          <Check aria-hidden="true" size={16} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
export function PublicClosing() {
  return (
    <section className={s.container} style={{ paddingBottom: 75 }}>
      <div className={s.closing}>
        <div>
          <p className={s.eyebrow}>Start with a conversation</p>
          <h2>
            Let’s find the work
            <br />
            you could be saying yes to.
          </h2>
          <p>
            Tell us about your shop, your backlog, and where you need support.
            We’ll talk through whether Lattice is a fit.
          </p>
        </div>
        <BookCallLink />
      </div>
    </section>
  );
}
export function PublicAuthLayout({
  children,
  recovery = false,
}: {
  children: ReactNode;
  recovery?: boolean;
}) {
  return (
    <PublicSite>
      <main className={`${s.container} ${s.authLayout}`} id="main-content">
        <div className={s.authCopy}>
          <InviteOnlyLabel>For invited manufacturing teams</InviteOnlyLabel>
          <h2>Your next production path starts here.</h2>
          <p>
            One place for your quotes, manufacturing requirements, quality
            documents, and order updates.
          </p>
          <div className={s.authImage}>
            <Image
              alt="Machined metal housing inside a CNC machining center"
              fill
              sizes="460px"
              src="/landing/manufacturing-proof-cnc.png"
            />
          </div>
        </div>
        <div>
          <div className={s.authPanel}>{children}</div>
          <p className={s.authLinks}>
            {recovery ? (
              <Link href="/login">Back to your account</Link>
            ) : (
              <>
                New to Lattice?{" "}
                <Link href="/book-a-call">Let’s talk about your shop</Link>
              </>
            )}
          </p>
        </div>
      </main>
    </PublicSite>
  );
}
