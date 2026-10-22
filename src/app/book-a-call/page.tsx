import type { Metadata } from "next";
import Link from "next/link";
import { CallRequestForm } from "@/components/call-request-form";
import {
  CheckList,
  InviteOnlyLabel,
  PublicSite,
} from "@/components/public-marketing";
import s from "@/components/public-marketing.module.css";

export const metadata: Metadata = {
  title: "Book a call | Lattice",
  description:
    "Tell us about your machine shop and manufacturing needs. Request an introductory call with Lattice to explore additional production capacity.",
};
export default function BookACallPage() {
  return (
    <PublicSite>
      <main className={`${s.container} ${s.formLayout}`} id="main-content">
        <div className={s.formIntro}>
          <InviteOnlyLabel>Access starts with a conversation</InviteOnlyLabel>
          <h1>Let’s talk shop.</h1>
          <p>
            Your backlog, your capabilities, the work you’d like to keep. Tell
            us where your shop needs support, and we’ll explore whether Lattice
            can help.
          </p>
          <CheckList
            items={[
              "Talk with the team coordinating your work",
              "Discuss overflow, repeat production, or capability gaps",
              "Understand the process before requesting an invitation",
            ]}
          />
          <p>No job ready? That’s fine. Start with your shop.</p>
          <Link className={s.textLink} href="/waiting-list">
            Prefer to request access first? →
          </Link>
        </div>
        <CallRequestForm />
      </main>
    </PublicSite>
  );
}
