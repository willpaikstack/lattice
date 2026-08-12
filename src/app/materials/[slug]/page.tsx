import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MaterialGradeDirectory } from "@/components/material-grade-directory";
import { PlasticFunctionalProfile } from "@/components/plastic-functional-profile";
import { PlasticFunctionalProfileGroup } from "@/components/plastic-functional-profile-group";
import { getMaterialFamilyDetail, materialFamilies } from "@/lib/material-family-view-models";

type MaterialFamilyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return materialFamilies.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: MaterialFamilyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const material = getMaterialFamilyDetail(slug);

  return material
    ? { title: `${material.name} materials | Lattice OS`, description: material.summary }
    : { title: "Material not found | Lattice OS" };
}

function GradeProfileRow({ grade, usesFunctionalTraits = false }: { grade: NonNullable<ReturnType<typeof getMaterialFamilyDetail>>["featuredGrades"][number]; usesFunctionalTraits?: boolean }) {
  const machinabilityScore = ["Excellent", "Good", "Easy"].includes(grade.machinability)
    ? 4
    : ["Fair", "Medium"].includes(grade.machinability)
      ? 2
      : 1;

  return (
    <article className="grid gap-4 border-b border-[#e3e2df] p-3 last:border-b-0 sm:grid-cols-[112px_minmax(0,1fr)] lg:grid-cols-[112px_118px_minmax(180px,1fr)_122px_minmax(220px,1.25fr)] lg:items-start lg:gap-5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[7px] bg-[#eeeeec] sm:aspect-auto sm:min-h-[84px]">
        <Image alt={grade.imageAlt} className="object-cover" fill sizes="(max-width: 640px) 100vw, 112px" src={grade.image} />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 lg:block">
          <h3 className="text-[17px] font-semibold leading-6 tracking-[-0.02em] text-[#202020]">{grade.name}</h3>
          <p className="mt-0.5 text-[12px] text-[#77797c]">{grade.uns}</p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[12px] text-[#505257]">Typical form / use</p>
        <p className="mt-1 text-[13px] font-medium leading-5 text-[#2c2d2f]">{grade.forms}</p>
        <p className="text-[12px] leading-[18px] text-[#626469]">{grade.applications}</p>
      </div>

      <div>
        <p className="text-[12px] text-[#505257]">Machinability</p>
        <p className="mt-1 text-[13px] font-medium text-[#2c2d2f]">{grade.machinability}</p>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((index) => {
            const filled = index < machinabilityScore;
            return <span className={`h-2 w-4 rounded-[2px] border ${filled ? "border-[#55575a] bg-[#55575a]" : "border-[#d2d2d0] bg-transparent"}`} key={index} />;
          })}
        </div>
      </div>

      <div className="relative min-w-0 lg:pr-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-[12px] text-[#505257]">Selection note</p>
          {grade.commonStartingPoint ? (
            <span className="rounded-full bg-[#eeece7] px-2.5 py-1 text-[10px] font-medium leading-none text-[#55534f]">Common starting point</span>
          ) : null}
        </div>
        <p className="mt-1 text-[12px] leading-[18px] text-[#56585c]">{grade.selectionNote}</p>
      </div>

      {usesFunctionalTraits && grade.functionalTraits ? (
        <PlasticFunctionalProfile detailsClassName="sm:col-span-2 lg:col-span-5" summaryClassName="lg:ml-auto lg:w-[122px]" traits={grade.functionalTraits} />
      ) : grade.mechanicalProperties ? (
        <div className="pt-2.5 sm:col-span-2 lg:col-span-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[11px] font-medium text-[#5f6165]">Reference properties</p>
            <p className="text-[10px] leading-4 text-[#898b8f]">{grade.mechanicalProperties.condition} · 20°C</p>
          </div>
          <dl className="mt-1.5 grid grid-cols-2 gap-y-2 sm:grid-cols-5">
            {[
              ["Yield", grade.mechanicalProperties.yieldStrength],
              ["Tensile", grade.mechanicalProperties.tensileStrength],
              ["Elongation", grade.mechanicalProperties.elongation],
              ["Hardness", grade.mechanicalProperties.hardness],
              ["Density", grade.mechanicalProperties.density],
            ].map(([label, value]) => (
              <div className="min-w-0 sm:border-l sm:border-[#e5e4e1] sm:pl-3 sm:first:border-l-0 sm:first:pl-0" key={label}>
                <dt className="text-[10px] text-[#85878b]">{label}</dt>
                <dd className="mt-0.5 truncate text-[11px] font-medium text-[#3f4145]" title={value}>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[10px] leading-4 text-[#919397]">Typical reference only—not design allowables or certification. <a className="underline decoration-[#cacac6] underline-offset-2 transition hover:text-[#4c4e51]" href={grade.mechanicalProperties.sourceUrl} rel="noreferrer" target="_blank">Source</a></p>
        </div>
      ) : null}
    </article>
  );
}

export default async function MaterialFamilyPage({ params }: MaterialFamilyPageProps) {
  const { slug } = await params;
  const material = getMaterialFamilyDetail(slug);

  if (!material) notFound();

  const requestLabel = material.name.replace(" / ", " ").toLowerCase();

  const content = (
    <main className="min-h-screen bg-[#fbfbfa] pb-16">
      <div className="max-w-[1120px]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 pt-1 text-[14px] text-[#74767a]">
          <Link className="transition hover:text-[#202020]" href="/materials">Materials</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#3d3e41]">{material.name}</span>
        </nav>

        <header className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h1 className="text-[46px] font-bold leading-[0.98] tracking-[-0.05em] text-[#171717] sm:text-[52px]">{material.name}</h1>
            <p className="mt-3 max-w-[670px] text-[15px] leading-6 text-[#676a70]">{material.summary}</p>
            <p className="mt-4 text-[15px] font-medium text-[#36373a]">{material.gradeCount} {material.catalogNoun}</p>
          </div>

          <Link className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[6px] border border-[#d8d7d3] bg-white px-4 text-[13px] font-medium text-[#3d3e41] transition hover:border-[#bdbdb9] hover:bg-[#f8f8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 focus-visible:ring-offset-2 lg:min-w-[190px]" href="/requests/new">
            Request {requestLabel} parts
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </header>

        <div className={`relative mt-6 min-h-[220px] overflow-hidden rounded-[7px] bg-[#e9e9e7] ${material.slug === "plastics-polymers" ? "aspect-[5/1]" : "aspect-[16/5]"}`}>
          <Image alt={material.heroAlt} className="object-cover" fill preload sizes="(max-width: 1200px) 100vw, 1120px" src={material.heroImage} />
        </div>

        <section className="mt-7" aria-labelledby="common-grades-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[23px] font-semibold tracking-[-0.025em] text-[#202020]" id="common-grades-title">Common grades</h2>
            <Link className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3d3e41] transition hover:text-black" href="#all-grades">
              View all {material.gradeCount} {material.catalogNoun}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-[#deddda] bg-white">
            {material.featuredGrades.map((grade) => <GradeProfileRow grade={grade} key={grade.name} usesFunctionalTraits={material.slug === "plastics-polymers"} />)}
          </div>
          {material.slug === "plastics-polymers" ? <p className="border-t border-[#e3e2df] px-3 py-3 text-[11px] leading-4 text-[#73757a]"><span className="font-medium text-[#55575a]">Functional selection guidance</span> — confirm the specific resin grade and data sheet during RFQ.</p> : null}
        </section>

        <MaterialGradeDirectory familyName={material.name} groups={material.catalogEntry.materialGroups} totalCount={material.gradeCount} />
      </div>
    </main>
  );

  return material.slug === "plastics-polymers"
    ? <PlasticFunctionalProfileGroup>{content}</PlasticFunctionalProfileGroup>
    : content;
}
