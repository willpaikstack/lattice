import { CatalogCard } from "../../components/catalog-card";
import { materials } from "../../lib/catalog-data";

export default function MaterialsPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-12">
      <section className="max-w-[1010px]">
        <h1 className="text-[56px] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#222222]">Material Catalog</h1>
        <div className="mt-1 max-w-[1000px] space-y-5 text-[14px] leading-[1.55] text-[#737373]">
          <p>
            Lattice leverages strategic supplier partnerships and consolidated purchasing power to deliver consistent, competitive material pricing across stainless, nickel alloys, aluminum, and specialty grades. These relationships are built on deep fabrication experience and high-volume sourcing programs — not transactional purchasing.
          </p>
          <p>
            By working directly with mills and authorized distributors, we provide access to wholesale pricing without restrictive minimum order quantities. Every material is supplied with full traceability, mill certifications, and compliance documentation to meet the standards required by demanding industrial applications.
          </p>
          <p>
            <span className="block">The result:</span>
            Reliable material availability, verified quality, and wholesale pricing without wholesale MOQs. That improves your competitiveness — not just ours.
          </p>
        </div>
      </section>

      <section className="ml-8 mt-[165px] max-w-[961px] space-y-5" aria-label="Material categories">
        {materials.map((material) => (
          <CatalogCard
            commonGrades={material.commonGrades}
            defaultOpen={material.slug === "stainless-steel"}
            details={material.details}
            key={material.slug}
            standards={material.standards}
            subCards={material.variants}
            summary={material.summary}
            title={material.name}
            variant="bubble-material"
          />
        ))}
      </section>
    </div>
  );
}
