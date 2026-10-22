import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Focus,
  Layers3,
  MoveUpRight,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import {
  BookCallLink,
  CheckList,
  InviteOnlyLabel,
  PublicClosing,
  PublicSite,
} from "@/components/public-marketing";
import s from "@/components/public-marketing.module.css";

export const metadata: Metadata = {
  title: "Lattice | More capacity. Still your customer.",
  description:
    "An invite-only manufacturing network for domestic machine shops. Add CNC machining and fabrication capacity with Lattice managing supplier coordination, quality documentation, and delivery. Book a call to explore the fit.",
};
const situations = [
  {
    title: "The schedule is full.",
    body: "A good job comes in, but every machine is spoken for. Route suitable overflow work through Lattice while your team stays focused on existing commitments.",
  },
  {
    title: "The job needs more.",
    body: "A process, material, or machine you don’t have in-house. Explore a qualified production path without buying equipment for a single opportunity.",
  },
  {
    title: "The demand comes in waves.",
    body: "Add capacity for repeat work and demand peaks. Keep your own floor available for the urgent, complex work that needs your team.",
  },
];
const capabilities = [
  {
    icon: Focus,
    title: "CNC milling",
    body: "3-, 4-, and 5-axis machining for prismatic parts, housings, fixtures, and complex geometries.",
  },
  {
    icon: Wrench,
    title: "CNC turning",
    body: "Turned components, shafts, bushings, and parts that combine turning and milled features.",
  },
  {
    icon: Layers3,
    title: "Sheet metal fabrication",
    body: "Cutting, forming, and fabrication coordinated around your drawings and finishing requirements.",
  },
];
const steps = [
  {
    title: "Start with your shop",
    body: "Talk through your work, capacity gaps, and what a useful partnership would look like.",
  },
  {
    title: "Share a suitable job",
    body: "Once invited, submit CAD, drawings, quantities, materials, and the requirements that matter.",
  },
  {
    title: "Review a real quote",
    body: "We confirm a production path and prepare a supplier-backed quote with pricing and lead time.",
  },
  {
    title: "Keep the work moving",
    body: "Lattice coordinates production, requested quality documents, and delivery. You stay informed.",
  },
];
export default function LandingPage() {
  return (
    <PublicSite>
      <main id="main-content">
        <section className={`${s.container} ${s.hero}`}>
          <div className={s.heroCopy}>
            <InviteOnlyLabel />
            <h1>
              Take on the work.
              <br />
              <span>
                Keep your floor
                <br />
                focused.
              </span>
            </h1>
            <p className={s.intro}>
              More work shouldn’t always mean more machines. Lattice connects
              domestic machine shops with qualified global manufacturing
              capacity—and manages the work from quote to delivery.
            </p>
            <div className={s.actions}>
              <BookCallLink />
              <Link className={s.textLink} href="/how-it-works">
                See how it works <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <p className={s.smallNote}>
              Built for machine shops and small manufacturers. Access by
              invitation.
            </p>
          </div>
          <div className={s.heroVisual}>
            <div className={s.imageFrame}>
              <Image
                alt="Precision-machined aluminum housing fixtured inside a CNC machining center"
                fill
                priority
                sizes="(max-width:760px) 90vw,45vw"
                src="/landing/manufacturing-proof-cnc.png"
              />
              <span className={s.imageLabel}>CAPACITY BEYOND YOUR FLOOR</span>
              <span className={s.imageCaption}>
                CNC MACHINING / FABRICATION
              </span>
            </div>
            <div className={s.visualNote}>
              <MoveUpRight size={27} strokeWidth={1.3} aria-hidden="true" />
              <div>
                <strong>More capacity. Still your customer.</strong>
                <p>You own the relationship. We coordinate the production.</p>
              </div>
            </div>
          </div>
        </section>
        <div className={s.proofStrip}>
          <div className={`${s.container} ${s.proofItems}`}>
            <p>
              A production partner,
              <br />
              beyond the purchase order.
            </p>
            <span>
              <Check size={17} aria-hidden="true" />
              Supplier-backed quotes
            </span>
            <span>
              <ClipboardCheck size={17} aria-hidden="true" />
              Job-specific quality requirements
            </span>
            <span>
              <ShieldCheck size={17} aria-hidden="true" />
              One point of coordination
            </span>
          </div>
        </div>
        <section className={`${s.container} ${s.section}`}>
          <p className={s.eyebrow}>Built around the realities of your shop</p>
          <div className={s.sectionHeading}>
            <h2>
              A good opportunity.
              <br />
              An already busy shop.
            </h2>
            <p>
              You know the work. You know your customers. Sometimes you just
              need another way to get the job done.
            </p>
          </div>
          <div className={s.situations}>
            {situations.map((item, index) => (
              <article className={s.situation} key={item.title}>
                <span className={s.number}>0{index + 1} /</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={`${s.section} ${s.darkSection}`} id="capabilities">
          <div className={s.container}>
            <p className={s.eyebrow}>An extension of your capabilities</p>
            <div className={s.sectionHeading}>
              <h2>
                The right process.
                <br />
                Beyond your own machines.
              </h2>
              <p>
                Access qualified overseas manufacturing partners through a team
                that coordinates the details.
              </p>
            </div>
            <div className={s.capabilities}>
              {capabilities.map(({ icon: Icon, title, body }, index) => (
                <article className={s.capability} key={title}>
                  <Icon aria-hidden="true" size={32} strokeWidth={1.2} />
                  <span className={s.number}>0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <p className={s.capabilityNote}>
              Process, material, tolerance, finish, and production availability
              are reviewed for each job.
            </p>
          </div>
        </section>
        <section className={`${s.container} ${s.section} ${s.split}`}>
          <div className={s.splitImage}>
            <Image
              alt="Illustrative dimensional inspection report beside an engineering drawing"
              fill
              sizes="(max-width:760px) 90vw,45vw"
              src="/landing/manufacturing-proof-inspection-report.png"
            />
          </div>
          <div className={s.splitCopy}>
            <p className={s.eyebrow}>The details stay with the job</p>
            <h2>
              More than finding
              <br />
              someone to make it.
            </h2>
            <p>
              Outsourcing only helps if someone owns the follow-through. Lattice
              coordinates the manufacturing requirements, supplier
              communication, and documentation from the start.
            </p>
            <CheckList
              items={[
                "A production path reviewed against your drawings",
                "Requested inspection reports and material documentation",
                "Order updates and delivery coordination",
              ]}
            />
            <Link className={s.textLink} href="/how-it-works">
              Explore the Lattice workflow{" "}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </section>
        <section className={`${s.section} ${s.workflow}`}>
          <div className={s.container}>
            <div className={s.sectionHeading}>
              <div>
                <p className={s.eyebrow}>
                  From first conversation to finished parts
                </p>
                <h2>
                  Start small.
                  <br />
                  Build a working relationship.
                </h2>
              </div>
              <Link className={s.textLink} href="/how-it-works">
                How it works <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <ol className={s.steps}>
              {steps.map((step, index) => (
                <li className={s.step} key={step.title}>
                  <span className={s.number}>0{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className={`${s.container} ${s.section} ${s.faq}`}>
          <div>
            <p className={s.eyebrow}>A few things to know</p>
            <h2>
              A conversation first.
              <br />A better fit from the start.
            </h2>
          </div>
          <div>
            <details>
              <summary>Why is Lattice invite-only?</summary>
              <p>
                We start by understanding your shop and the work you need
                support with. Access follows a conversation about fit, so the
                production requirements and working relationship are clear from
                the start.
              </p>
            </details>
            <details>
              <summary>Is Lattice for shops like mine?</summary>
              <p>
                We focus on domestic machine shops and small manufacturing
                companies that need help with overflow, repeat production, or
                work beyond their in-house capabilities.
              </p>
            </details>
            <details>
              <summary>Where are parts manufactured?</summary>
              <p>
                Lattice works with qualified overseas manufacturing partners,
                including partners in China. We review the production path and
                applicable requirements for each job. Domestic-only or
                restricted work may not be suitable.
              </p>
            </details>
            <details>
              <summary>Do I need a job ready to quote?</summary>
              <p>
                No. The first call can simply be about your shop, the work you
                do, and where capacity gets tight. If you have a suitable job in
                mind, we can talk through what would be needed to review it.
              </p>
            </details>
            <details>
              <summary>Can I request access without a call?</summary>
              <p>
                Yes.{" "}
                <Link
                  className="underline underline-offset-4"
                  href="/waiting-list"
                >
                  Request access
                </Link>{" "}
                and share a little about your company and manufacturing needs.
                We’ll review your request before inviting your team.
              </p>
            </details>
          </div>
        </section>
        <PublicClosing />
      </main>
    </PublicSite>
  );
}
