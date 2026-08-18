import Image from "next/image";
import { Axis3D, CircleDotDashed, Network, ScanSearch, Wrench } from "lucide-react";

import { CapabilitiesProductionGallery } from "@/components/capabilities-production-gallery";

const factoryImages = [
  {
    alt: "Operators working beside a press brake line in a sheet metal production area",
    src: "/capabilities/factory-proof/press-brake-floor.png",
  },
  {
    alt: "A technician completing a sheet metal finishing operation",
    src: "/capabilities/factory-proof/finishing-detail.png",
  },
  {
    alt: "A technician working at a coordinate measuring machine in a quality control room",
    src: "/capabilities/factory-proof/quality-control-cmm.png",
  },
  {
    alt: "An operator running a CNC machining center",
    src: "/capabilities/factory-proof/cnc-machining-cell-02.png",
  },
];

const defaultFactoryImage = {
  alt: "CNC machining centers arranged along a production-floor aisle",
  src: "/capabilities/factory-proof/cnc-machining-line-03.png",
};

const capabilities = [
  {
    description:
      "Our equipment list covers 3-, 4-, and 5-axis CNC milling for precision components through large-format machining, with milling envelopes up to 3000 × 2200 × 1100 mm.",
    icon: Axis3D,
    iconName: "multi-axis",
    image: "/capabilities/factory-proof/cnc-machining-cell.png",
    imageAlt: "Operator running a CNC machining center",
    title: "CNC milling",
  },
  {
    description:
      "CNC turning, Swiss-type turning, and turn-mill production for rotational and complex turned parts. The production path is selected around the drawing, quantity, material, and inspection requirements.",
    icon: CircleDotDashed,
    iconName: "rotational-turning",
    image: "/capabilities/factory-proof/cnc-turning-operation.png",
    imageAlt: "Operator setting up a CNC turning center",
    title: "CNC turning",
  },
  {
    description:
      "Wire EDM, laser cutting and forming, welding, grinding, and other secondary operations can be coordinated when the part and production plan require them.",
    icon: Wrench,
    iconName: "supporting-tools",
    image: "/capabilities/factory-proof/press-brake-operation.png",
    imageAlt: "Operators working beside a press brake line in a sheet metal production area",
    title: "Supporting processes",
  },
  {
    description:
      "Coordinate measuring machines, vision measurement, X-ray fluorescence, roughness, hardness, and ultrasonic inspection are matched to the job before award when required.",
    icon: ScanSearch,
    iconName: "inspection-scan",
    image: "/capabilities/factory-proof/inspection-lab-cmm.png",
    imageAlt: "Technicians working in a coordinate-measuring-machine inspection laboratory",
    title: "Inspection-ready production",
  },
  {
    description:
      "More than 590 people work across 42,000 m² of production space in the Lattice manufacturing network, spanning machining, fabrication, quality, and production support.",
    icon: Network,
    iconName: "manufacturing-network",
    metrics: [
      { label: "People", value: "590+" },
      { label: "Production space", value: "42,000 m²" },
    ],
    title: "Network scale",
  },
];

export default function CapabilitiesPage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] pb-20 font-sans text-stone-950 selection:bg-stone-200 lg:pb-28">
        <CapabilitiesProductionGallery
          defaultImage={defaultFactoryImage}
          images={factoryImages}
          heroContent={
            <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Capabilities</p>
            <h1
              aria-label="Fabrication capabilities"
              className="mt-5 text-5xl font-semibold leading-[0.94] tracking-[-0.055em] text-stone-950 sm:text-6xl lg:text-7xl"
              id="capabilities-heading"
            >
              Fabrication
              <br />
              capabilities
            </h1>
            <p className="mt-7 max-w-[440px] text-[17px] leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Qualified CNC machining and fabrication capacity for prototype and production parts—planned around the requirements that matter to your customer.
            </p>
            </>
          }
          proofContent={
            <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Production environments</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-stone-950 sm:text-3xl" id="factory-proof-heading">
              Built around real production environments.
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              A look at the facilities, equipment, and inspection infrastructure Lattice can bring to support your production work.
            </p>
            </>
          }
        />

        <section aria-labelledby="process-heading" className="pt-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Process coverage</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl" id="process-heading">
              Explore our capabilities.
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-slate-600">
              Every job starts with a clear view of the available processes. Lattice confirms the production path, quality requirements, and fit before release.
            </p>
          </div>

          <div className="mt-10 divide-y divide-stone-200 border-y border-stone-200">
            {capabilities.map(({ description, icon: Icon, iconName, image, imageAlt, metrics, title }) => (
              <section className="grid gap-5 py-6 md:grid-cols-[minmax(0,0.9fr)_minmax(220px,0.58fr)] md:items-center md:gap-10" key={title}>
                <div className="flex items-start gap-4 sm:gap-5">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-slate-700" data-capability-icon={iconName}>
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.55} />
                  </span>
                  <div className="max-w-[600px]">
                    <h3 className="text-xl font-semibold tracking-[-0.025em] text-stone-950">{title}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-slate-600">{description}</p>
                  </div>
                </div>
                {metrics ? (
                  <dl className="grid grid-cols-2 overflow-hidden rounded-md border border-stone-200 bg-stone-50 md:w-[330px] md:justify-self-end">
                    {metrics.map((metric, index) => (
                      <div className={`px-5 py-5 ${index === 0 ? "border-r border-stone-200" : ""}`} key={metric.label}>
                        <dt className="text-xs font-medium text-slate-500">{metric.label}</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-stone-950">{metric.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : image && imageAlt ? (
                  <figure className="overflow-hidden rounded-md border border-stone-200 bg-stone-100 md:justify-self-end">
                    <Image alt={imageAlt} className="aspect-[16/7] h-auto w-full object-cover md:w-[330px]" height={350} sizes="(min-width: 768px) 330px, 100vw" src={image} width={640} />
                  </figure>
                ) : (
                  <span aria-hidden="true" className="hidden md:block" />
                )}
              </section>
            ))}
          </div>
        </section>

    </main>
  );
}
