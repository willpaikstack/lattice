"use client";

import { ExternalLink, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { MaterialFamilyCardData } from "@/lib/material-family-view-models";

export function MaterialFamilyCatalog({ families }: { families: MaterialFamilyCardData[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredFamilies = useMemo(
    () =>
      normalizedQuery
        ? families.filter((family) =>
            [family.name, family.summary, ...family.grades].some((value) => value.toLowerCase().includes(normalizedQuery)),
          )
        : families,
    [families, normalizedQuery],
  );

  return (
    <>
      <header className="max-w-[1120px]">
        <h1 className="text-[48px] font-bold leading-none tracking-[-0.045em] text-[#202020] sm:text-[52px]">Materials</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#6f7175]">Browse the material families our manufacturing network can produce parts from.</p>

        <div className="mt-7 flex flex-col gap-3 lg:flex-row">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search materials</span>
            <Search aria-hidden="true" className="absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-[#777b80]" strokeWidth={1.8} />
            <input
              className="h-12 w-full rounded-[7px] border border-[#d8d9dc] bg-white pl-12 pr-4 text-[15px] text-[#242424] outline-none transition placeholder:text-[#929397] hover:border-[#c7c8cb] focus:border-[#8b8d91] focus:ring-2 focus:ring-[#222222]/10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by grade, alloy, or family"
              type="search"
              value={query}
            />
          </label>
          <Link
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[7px] border border-[#d8d9dc] bg-white px-5 text-[14px] font-medium text-[#44464a] transition hover:border-[#bfc1c4] hover:bg-[#f7f7f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222]/20"
            href="/requests/new"
          >
            Request an unlisted material
            <ExternalLink aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <section aria-label="Material families" className="mt-7 grid max-w-[1120px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFamilies.map((family) => (
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

      {filteredFamilies.length === 0 ? (
        <div className="mt-7 max-w-[1120px] rounded-[7px] border border-dashed border-[#d4d5d7] bg-white px-6 py-12 text-center">
          <h2 className="text-base font-semibold text-[#252525]">No matching material family</h2>
          <p className="mt-2 text-sm text-[#77797d]">Try another grade or request an unlisted material for review.</p>
        </div>
      ) : null}

    </>
  );
}
