import Image from "next/image";
import {
  BookCallLink,
  CheckList,
  InviteOnlyLabel,
  PublicClosing,
  PublicSite,
} from "./public-marketing";
import s from "./public-marketing.module.css";

const steps = [
  {
    title: "First, we get to know your shop.",
    body: "Tell us what you make, where capacity gets tight, and which jobs you’d like help with. We’ll discuss fit and invite your team when there’s a suitable path forward.",
  },
  {
    title: "You bring the requirements.",
    body: "In your invited workspace, submit CAD, drawings, quantities, materials, finishes, tolerances, and any inspection or documentation needs. Your parts and their requirements stay together.",
  },
  {
    title: "We build the production path.",
    body: "Lattice reviews the package, clarifies open questions, and coordinates a qualified overseas manufacturing partner. You receive a supplier-backed quote with pricing and production timing to review.",
  },
  {
    title: "We coordinate. You stay informed.",
    body: "Once the quote is accepted and the order is placed, Lattice coordinates production and provides order updates. Requested inspection reports and material records are available for review before shipment. An agreed quality approval hold keeps shipment pending your approval.",
  },
];

export function PublicHowItWorks() {
  return (
    <PublicSite>
      <main id="main-content">
        <div className={s.container}>
          <header className={s.workflowIntro}>
            <InviteOnlyLabel>How Lattice works</InviteOnlyLabel>
            <h1>
              Your customer.
              <br />
              Your requirements.
              <br />
              Another way to deliver.
            </h1>
            <p className={s.intro}>
              Lattice gives domestic machine shops access to qualified global
              manufacturing capacity, with one team coordinating the work from
              quote through delivery.
            </p>
            <BookCallLink />
          </header>
          <div className={s.workflowRows}>
            {steps.map((step, index) => (
              <section className={s.workflowRow} key={step.title}>
                <span className={s.number}>0{index + 1} /</span>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
              </section>
            ))}
          </div>
          <section className={`${s.section} ${s.split}`}>
            <div className={s.splitCopy}>
              <p className={s.eyebrow}>A practical first job</p>
              <h2>
                Start with work
                <br />
                you know well.
              </h2>
              <p>
                Repeat parts, stable drawings, clear material requirements, and
                enough lead time make a useful starting point. Keep the urgent,
                evolving work on your own floor while we review where additional
                capacity can help.
              </p>
              <CheckList
                items={[
                  "CNC milling, turning, and sheet metal fabrication",
                  "Process and inspection requirements reviewed per job",
                  "Overseas production, including manufacturing partners in China",
                ]}
              />
              <p>
                Domestic-only and export-restricted jobs may not be suitable for
                this network. We review eligibility before quoting.
              </p>
            </div>
            <div className={s.splitImage}>
              <Image
                alt="Illustrative inspection documentation and engineering drawing"
                fill
                sizes="(max-width:760px) 90vw,45vw"
                src="/landing/manufacturing-proof-inspection-report.png"
              />
            </div>
          </section>
        </div>
        <PublicClosing />
      </main>
    </PublicSite>
  );
}
