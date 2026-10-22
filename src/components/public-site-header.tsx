import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LatticeBrand } from "@/components/lattice-brand";
import s from "./public-marketing.module.css";

export function PublicSiteHeader() {
  return (
    <header className={s.header}>
      <a className={s.skipLink} href="#main-content">
        Skip to content
      </a>
      <div className={s.headerInner}>
        <Link aria-label="Lattice home" href="/">
          <LatticeBrand />
        </Link>
        <nav aria-label="Public navigation" className={s.navigation}>
          <Link className={s.desktopLink} href="/how-it-works">
            How it works
          </Link>
          <Link className={s.desktopLink} href="/#capabilities">
            Capabilities
          </Link>
          <Link className={s.loginLink} href="/login">
            Log in
          </Link>
          <Link className={s.button} href="/book-a-call">
            Book a call <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
