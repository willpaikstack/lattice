import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/session";
import { submitMaterialInquiryAction } from "./actions";

type MaterialInquiryPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

const inputClass = "mt-2 h-11 w-full rounded-[6px] border border-[#d8d9dc] bg-white px-3 text-[14px] text-[#242424] outline-none transition placeholder:text-[#929397] focus:border-[#8b8d91] focus:ring-2 focus:ring-[#222222]/10";
const textareaClass = "mt-2 min-h-28 w-full resize-y rounded-[6px] border border-[#d8d9dc] bg-white px-3 py-3 text-[14px] text-[#242424] outline-none transition placeholder:text-[#929397] focus:border-[#8b8d91] focus:ring-2 focus:ring-[#222222]/10";

export default async function MaterialInquiryPage({ searchParams }: MaterialInquiryPageProps) {
  const [session, params] = await Promise.all([getCurrentSession(), searchParams]);

  if (!session) {
    redirect("/login?returnTo=/materials/inquiry");
  }

  if (params?.status === "submitted") {
    return (
      <div className="min-h-screen pb-14">
        <div className="max-w-[760px]">
          <div className="rounded-[8px] border border-[#d9ded9] bg-white p-7 sm:p-9">
            <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-[#4f6a55]" strokeWidth={1.7} />
            <h1 className="mt-5 text-[36px] font-semibold tracking-[-0.035em] text-[#202020]">Material inquiry received</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#65686d]">
              Lattice will review the designation, stock form, supplier coverage, and documentation requirements, then follow up at {session.user.email}.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="inline-flex h-11 items-center justify-center rounded-[6px] bg-[#202020] px-5 text-[14px] font-semibold text-white transition hover:bg-black" href="/materials">
                Back to materials
              </Link>
              <Link className="inline-flex h-11 items-center justify-center rounded-[6px] border border-[#d8d9dc] bg-white px-5 text-[14px] font-medium text-[#44464a] transition hover:bg-[#f7f7f6]" href="/materials/inquiry">
                Submit another inquiry
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-14">
      <div className="max-w-[980px]">
        <Link className="inline-flex items-center gap-2 text-[13px] font-medium text-[#626469] transition hover:text-[#202020]" href="/materials">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Materials
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <section>
            <h1 className="text-[42px] font-bold leading-none tracking-[-0.045em] text-[#202020] sm:text-[48px]">Request an unlisted material</h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-6 text-[#676a70]">
              Tell us what material you need. We will check the designation, available forms and conditions, supplier coverage, and any documentation requirements before confirming it for an RFQ.
            </p>

            <form action={submitMaterialInquiryAction} aria-label="Unlisted material inquiry form" className="mt-7 rounded-[8px] border border-[#deddda] bg-white p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-[13px] font-semibold text-[#3d3e41] sm:col-span-2" htmlFor="material-name">
                  Material name or family
                  <input className={inputClass} id="material-name" name="materialName" placeholder="Example: Cobalt-chrome alloy" required />
                </label>

                <label className="text-[13px] font-semibold text-[#3d3e41]" htmlFor="specification">
                  Grade, specification, or trade name
                  <input className={inputClass} id="specification" name="specification" placeholder="Example: ASTM F75" />
                </label>

                <label className="text-[13px] font-semibold text-[#3d3e41]" htmlFor="company">
                  Company
                  <input autoComplete="organization" className={inputClass} id="company" name="company" placeholder="Company name" required />
                </label>

                <label className="text-[13px] font-semibold text-[#3d3e41]" htmlFor="stock-form">
                  Preferred stock form
                  <select className={inputClass} defaultValue="" id="stock-form" name="stockForm">
                    <option value="">Not sure</option>
                    <option value="Bar">Bar</option>
                    <option value="Plate">Plate</option>
                    <option value="Sheet">Sheet</option>
                    <option value="Tube">Tube</option>
                    <option value="Casting">Casting</option>
                    <option value="Forging">Forging</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="text-[13px] font-semibold text-[#3d3e41]" htmlFor="quantity">
                  Estimated quantity
                  <input className={inputClass} id="quantity" name="quantity" placeholder="Example: 250 parts annually" />
                </label>

                <label className="text-[13px] font-semibold text-[#3d3e41] sm:col-span-2" htmlFor="intended-use">
                  Application and requirements
                  <textarea className={textareaClass} id="intended-use" name="intendedUse" placeholder="Describe the part, operating environment, required condition, certifications, or why this material was selected." required />
                </label>

                <label className="text-[13px] font-semibold text-[#3d3e41] sm:col-span-2" htmlFor="notes">
                  Additional notes
                  <textarea className={textareaClass} id="notes" name="notes" placeholder="Include acceptable substitutes, target timing, or sourcing constraints." />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-[#ececed] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] leading-5 text-[#77797d]">Submitting as {session.user.name} · {session.user.email}</p>
                <button className="inline-flex h-11 items-center justify-center rounded-[6px] bg-[#202020] px-5 text-[14px] font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#202020]/25 focus-visible:ring-offset-2" type="submit">
                  Submit inquiry
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-[8px] border border-[#deddda] bg-[#f5f4f1] p-5">
            <h2 className="text-[16px] font-semibold text-[#292a2c]">What happens next</h2>
            <ol className="mt-4 space-y-4">
              {[
                ["1", "Review", "We verify the exact material designation and required condition."],
                ["2", "Supplier check", "We confirm forms, dimensions, availability, and documentation with the network."],
                ["3", "Follow-up", "We contact you with availability, alternatives, or questions."],
                ["4", "Catalog decision", "Repeatable network offerings can be added to the materials library."],
              ].map(([number, title, body]) => (
                <li className="grid grid-cols-[26px_1fr] gap-3" key={number}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#44464a]">{number}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#36373a]">{title}</p>
                    <p className="mt-1 text-[12px] leading-5 text-[#696b70]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}
