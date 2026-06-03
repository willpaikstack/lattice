import { Download, FileText } from "lucide-react";

const resources = [
  {
    description: "Reference quote layout used while shaping the buyer-facing Lattice quote PDF.",
    fileName: "quote-pdf-template.pdf",
    href: "/admin/resources/quote-template",
    label: "Quote PDF template",
    meta: "PDF - 3 pages - 50 KB",
  },
];

export default function AdminResourcesPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#e6d2bf] bg-[#fffaf6] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a4d2d]">Admin resources</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Resources</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              Keep internal templates and reference files close to the RFQ workflow so operators can download the same materials when reviewing quote output.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[#e6d2bf] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a4d2d]">Templates</p>
            <h2 className="mt-2 text-[22px] font-semibold text-[#171717]">Quote documents</h2>
          </div>
          <span className="rounded-md border border-[#ead7c5] bg-[#fffaf6] px-3 py-2 text-[12px] font-semibold text-[#6f4529]">{resources.length} file</span>
        </div>

        <div className="mt-5 divide-y divide-[#eeeeee] overflow-hidden rounded-md border border-[#eeeeee]">
          {resources.map((resource) => (
            <article className="grid gap-4 bg-white p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={resource.href}>
              <div className="flex min-w-0 gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#ead7c5] bg-[#fffaf6] text-[#7a4d2d]">
                  <FileText aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-[#171717]">{resource.label}</h3>
                  <p className="mt-1 text-[13px] leading-5 text-[#5f6673]">{resource.description}</p>
                  <p className="mt-2 text-[12px] font-medium text-[#7b8088]">{resource.meta}</p>
                </div>
              </div>
              <a
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#4f3424] px-4 text-sm font-semibold text-white transition hover:bg-[#3a281d]"
                download={resource.fileName}
                href={resource.href}
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Download
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
