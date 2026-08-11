import Link from "next/link";
import { ArrowLeft, FileCheck, Info } from "lucide-react";

const qualityDocuments = [
  {
    id: "standard-inspection",
    title: "Standard Inspection",
    summary: "The baseline visual and dimensional review included with every RFQ.",
    description: "Standard Inspection checks the part against the submitted requirements, drawing, and order details. It is included by default and cannot be removed from a request.",
  },
  {
    id: "dimensional-inspection-report",
    title: "Dimensional Inspection Report",
    summary: "A measurement table for the critical dimensions of the ordered part.",
    description: "The output lists each specified critical dimension with its nominal value, tolerance, measured result, and pass/fail status. Standard dimensional inspection normally uses calibrated hand tools suited to the feature, such as calipers, micrometers, height gauges, and pin gauges. A technical drawing is required so the supplier knows exactly which features and criteria to inspect.",
    methodology: "For larger production lots, critical dimensions are 100% inspected. Non-critical dimensional checks use a documented random sample under ISO 2859-1 / ANSI-ASQ Z1.4 normal inspection, with the AQL and sample size confirmed in the RFQ.",
  },
  {
    id: "formal-inspection",
    title: "Formal Inspection with Dimensional Report",
    summary: "A structured inspection record with documented dimensional results.",
    description: "Choose this when the project needs a more formal acceptance package than the standard inspection. The final scope is confirmed with the manufacturing partner during quote review.",
  },
  {
    id: "cmm-inspection",
    title: "CMM Inspection Report",
    summary: "An advanced dimensional report for complex geometry and tolerance-critical features.",
    description: "The part is measured on a calibrated, programmable coordinate measuring machine, such as the ZEISS CONTURA and ZEISS ACCURA CMMs documented in Lattice’s equipment repository. The probe establishes the drawing datums, measures the requested features, and produces a digital dimensional report instead of relying only on hand measurements.",
    methodology: "Compared with a standard dimensional report, CMM inspection provides more repeatable measurement for complex geometry, GD&T, and tight tolerances. Our inspection network lists ZEISS CMM capacity with 0.001 mm listed precision; the achievable measurement uncertainty and feature coverage are confirmed for each RFQ based on the part, datum scheme, probe, and inspection environment.",
  },
  {
    id: "first-article",
    title: "First Article Inspection Report (FAIR AS9102)",
    summary: "A detailed review of an initial production part before the wider run.",
    description: "The supplier produces an initial part after setup, then reviews the drawing revision, datums, critical characteristics, material and process requirements, and any customer-specific acceptance criteria. The first article is measured and the actual results are recorded against the drawing before the broader production run proceeds.",
    methodology: "For an AS9102-style package, the report documents part accountability, relevant material and process evidence, characteristic accountability, and measurement results. Any nonconformance is reviewed and resolved before the inspection is accepted or the production plan advances.",
  },
  {
    id: "custom-inspection",
    title: "Custom Inspection",
    summary: "A customer-defined inspection plan for requirements outside the standard choices.",
    description: "This inspection is defined by the customer. Use it for a particular sampling plan, test, feature list, or acceptance method that is not fully covered by the standard options. Describe the requested scope and acceptance criteria in Manufacturing notes so Lattice can confirm it before supplier outreach.",
  },
  {
    id: "material-test-report",
    title: "Material Test Report (MTR)",
    summary: "Material documentation supplied for the raw stock used to make the part.",
    description: "An MTR can include the material grade, chemical composition, mechanical properties, heat or lot information, and applicable material standard. Availability depends on the material and supplier source.",
  },
];

export default function QualityDocumentationPage() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-2 pb-16 pt-4 sm:px-6 sm:pt-8 lg:px-10">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,740px)_190px] lg:justify-center lg:gap-20">
        <article className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-400">
            <Link className="transition hover:text-slate-700" href="/requests/new">Request Quote</Link>
            <span aria-hidden="true">/</span>
            <span>Documentation</span>
          </nav>

          <header className="mt-9 border-b border-slate-200 pb-8">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
              <FileCheck aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-[44px]">
              Inspection &amp; Certificates
            </h1>
            <p className="mt-4 max-w-[680px] text-[16px] leading-7 text-slate-600">
              Understand the inspection and material documentation that can accompany your manufacturing request. Lattice confirms the final scope with the manufacturing partner before quoting.
            </p>
            <p className="mt-5 text-sm text-slate-400">Last updated August 7, 2026 · Lattice Operations</p>
          </header>

          <section className="border-b border-slate-200 py-8" aria-labelledby="requesting-documentation">
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="requesting-documentation">How to request quality documentation</h2>
            <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600">
              <p>
                Standard Inspection is included with every RFQ. Add a documentation option when a project needs specific measurement evidence, a first-article review, or material records.
              </p>
              <p>
                Options marked <strong className="font-semibold text-slate-800">drawing required</strong> need a technical drawing. The drawing gives the supplier a clear reference for the features, datums, and tolerances to inspect.
              </p>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="available-documentation">
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="available-documentation">Available documentation</h2>
            <div className="mt-2 divide-y divide-slate-200">
              {qualityDocuments.map((document) => (
                <section className="scroll-mt-8 py-7" id={document.id} key={document.id}>
                  <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[21px]">{document.title}</h3>
                  <p className="mt-2 text-[15px] font-medium leading-6 text-slate-500">{document.summary}</p>
                  <p className="mt-3 text-[15px] leading-7 text-slate-600">{document.description}</p>
                  {"methodology" in document ? (
                    <p className="mt-3 border-l-2 border-slate-200 pl-4 text-[14px] leading-6 text-slate-500">{document.methodology}</p>
                  ) : null}
                </section>
              ))}
            </div>
          </section>

          <aside className="mt-8 flex gap-3 border-l-2 border-[#1d73ff] bg-slate-50 px-4 py-4 text-[14px] leading-6 text-slate-600">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#1d73ff]" />
            <p><strong className="font-semibold text-slate-800">Need a special inspection?</strong> Select Custom Inspection and define the required checks in Manufacturing notes. Lattice will confirm availability, cost, and timing before supplier outreach.</p>
          </aside>

          <Link className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950" href="/requests/new">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Return to Request Quote
          </Link>
        </article>

        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-8 border-l border-slate-200 pl-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">On this page</p>
            <div className="mt-4 space-y-3 text-sm leading-5">
              <a className="block text-slate-500 transition hover:text-slate-950" href="#requesting-documentation">How to request</a>
              <a className="block text-slate-500 transition hover:text-slate-950" href="#standard-inspection">Standard inspection</a>
              <a className="block text-slate-500 transition hover:text-slate-950" href="#dimensional-inspection-report">Dimensional report</a>
              <a className="block text-slate-500 transition hover:text-slate-950" href="#cmm-inspection">CMM inspection</a>
              <a className="block text-slate-500 transition hover:text-slate-950" href="#first-article">First article inspection</a>
              <a className="block text-slate-500 transition hover:text-slate-950" href="#custom-inspection">Custom inspection</a>
              <a className="block text-slate-500 transition hover:text-slate-950" href="#material-test-report">Material test report</a>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
}
