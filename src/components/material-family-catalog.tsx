import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { MaterialFamilyCardData } from "@/lib/material-family-view-models";

export function MaterialFamilyCatalog({ families }: { families: MaterialFamilyCardData[] }) {
  return (
    <>
      <header className="max-w-[1120px]">
        <h1 className="text-[48px] font-bold leading-none tracking-[-0.045em] text-[#202020] sm:text-[52px]">Materials</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#6f7175]">Browse the material families our manufacturing network can produce parts from.</p>

        <div className="mt-7">
          <Link
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[7px] border border-[#d8d9dc] bg-white px-5 text-[14px] font-medium text-[#44464a] transition hover:border-[#bfc1c4] hover:bg-[#f7f7f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222]/20"
            href="/materials/inquiry"
          >
            Request an unlisted material
            <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <section aria-label="Material families" className="mt-7 grid max-w-[1120px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {families.map((family) => (
          <Link
            className="group block rounded-[7px] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_7px_22px_rgba(0,0,0,0.055)] focus-visible:ring-2 focus-visible:ring-[#222222]/25"
            href={`/materials/${family.slug}`}
            key={family.slug}
          >
            <article className="grid min-h-[164px] overflow-hidden rounded-[7px] border border-[#dcdddf] bg-white transition group-hover:border-[#c8c9cc] sm:grid-cols-[minmax(0,1fr)_42px]">
              <div className="flex min-w-0 flex-col px-4 py-4">
                <div>
                  <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.015em] text-[#202020]">{family.name}</h2>
                  <p className="mt-1 text-[13px] text-[#74767a]">{family.gradeCount} {family.catalogNoun}</p>
                </div>

                <div className="mt-auto flex min-h-9 flex-wrap content-start gap-1.5 border-t border-[#ececed] pt-3" aria-label={`${family.name} example grades`}>
                  {family.examples.slice(0, 5).map((grade) => (
                    <span className="inline-flex h-[22px] items-center rounded-[4px] border border-[#dedfe1] bg-[#fbfbfb] px-2 text-[10px] font-medium text-[#55575a]" key={`${family.slug}-${grade}`}>
                      {grade}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative min-h-14 overflow-hidden border-t border-[#e2e3e5] sm:border-l sm:border-t-0" aria-hidden="true">
                <Image alt="" className="object-cover transition duration-500 group-hover:scale-[1.035]" fill sizes="42px" src={family.texture} />
              </div>
            </article>
          </Link>
        ))}
      </section>
    </>
  );
}
