"use client";

import { ArrowDown, ArrowRight, Box, ChevronDown, ExternalLink, FileText, Gauge, Layers, Ruler, ScanLine, Search, SlidersHorizontal, Wrench, X, Zap, RotateCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { explorerProcesses, filterExplorerEquipment, type ExplorerEquipment, type ExplorerProcess, type EquipmentSpecification } from "@/lib/equipment-explorer";
import styles from "./equipment-explorer.module.css";

const processCopy: Record<ExplorerProcess, { label: string; description: string; icon: typeof Box }> = {
  "CNC Milling": { label: "Milling", description: "Prismatic parts, pockets and multi-face features", icon: Box },
  "CNC Lathe": { label: "Turning", description: "Rotational parts, turn-mill and Swiss machining", icon: RotateCw },
  "Sheet Metal": { label: "Sheet metal", description: "Laser cutting and press-brake forming", icon: Layers },
  EDM: { label: "EDM", description: "Wire electrical discharge machining", icon: Zap },
  "QC & Inspection": { label: "Inspection", description: "Dimensional measurement and material testing", icon: ScanLine },
  "Manual Machines": { label: "Supporting equipment", description: "Supporting drilling, grinding and tapping", icon: Wrench },
};
const pageSize = 12;

function Specification({ specification, fallback }: { specification?: EquipmentSpecification; fallback: string }) {
  return <div><dt>{specification?.label ?? fallback}</dt><dd className={!specification ? styles.missing : undefined}>{specification?.value ?? "Confirm during RFQ"}</dd></div>;
}

function MachineCard({ machine }: { machine: ExplorerEquipment }) {
  const [open, setOpen] = useState(false);
  const Icon = processCopy[machine.process].icon;
  const primaryEnvelope = machine.envelopes[0];
  const secondary = machine.operating.find(item => !/control/i.test(item.label));
  return <article className={styles.machineCard} aria-labelledby={`title-${machine.id}`}>
    <header className={styles.machineHeader}>
      <span className={styles.machineIcon}><Icon size={20} aria-hidden="true" /></span>
      <div><p>{machine.type}</p><h3 id={`title-${machine.id}`}>{machine.model}</h3></div>
    </header>
    <div className={styles.envelope}>
      <span><Ruler size={15} aria-hidden="true" />{primaryEnvelope?.label ?? "Working capacity"}</span>
      <strong className={!primaryEnvelope ? styles.missing : undefined}>{primaryEnvelope?.value ?? "Confirm during RFQ"}</strong>
      {machine.envelopes[1] && <p><span>{machine.envelopes[1].label}</span> {machine.envelopes[1].value}</p>}
    </div>
    <dl className={styles.quickSpecs}>
      <Specification specification={machine.precision[0]} fallback={machine.process === "QC & Inspection" ? "Measurement precision" : "Precision claim"} />
      <Specification specification={secondary} fallback="Operating specification" />
      <div><dt>Listed quantity</dt><dd>{machine.quantity}</dd></div>
    </dl>
    <div className={styles.cardFooter}>
      <span><FileText size={14} aria-hidden="true" />Network record</span>
      <button type="button" aria-expanded={open} aria-controls={`details-${machine.id}`} onClick={() => setOpen(value => !value)}>{open ? "Close details" : "Specifications & sources"}<ChevronDown size={15} className={open ? styles.rotated : undefined} aria-hidden="true" /></button>
    </div>
    {open && <section className={styles.machineDetails} id={`details-${machine.id}`} aria-label={`${machine.model} specifications and sources`}>
      <h4>Documented specifications</h4>
      <p className={styles.detailIntro}>{machine.summary}</p>
      {machine.specifications.length ? <dl className={styles.fullSpecs}>{machine.specifications.map((item, index) => <Specification key={`${item.label}-${index}`} specification={item} fallback="" />)}</dl> : <p className={styles.detailIntro}>The record identifies this equipment but does not provide further customer-facing specifications. Include your requirements in the RFQ for review.</p>}
      <div className={styles.evidence}>
        <h4><FileText size={16} aria-hidden="true" />Source of listed values</h4>
        <p>Network equipment record <span className={styles.recordId}>{machine.id}</span></p>
        <p>These values come from Lattice’s equipment catalog, linked internally to partner equipment documentation. Quantity and capability are reported values; availability and your part’s requirements are confirmed per job.</p>
        {machine.sourceNote && <p>{machine.sourceNote}</p>}
        <p>Accuracy, repeatability and machining tolerance retain their documented labels. They are not interchangeable or a guarantee of finished-part results.</p>
        {machine.references.length > 0 ? <>
          <h4>Public technical references</h4>
          <ul>{machine.references.map(reference => <li key={reference.url}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.label}<ExternalLink size={13} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a><span>{new URL(reference.url).hostname.replace(/^www\./, "")}</span></li>)}</ul>
          <p>Reference literature may describe a different generation or configuration. It supplements the network record; it does not establish the installed machine’s capability.</p>
        </> : <p className={styles.referenceMissing}>A public model-specific reference is not linked to this record.</p>}
      </div>
    </section>}
  </article>;
}

export function EquipmentExplorer({ equipment }: { equipment: ExplorerEquipment[] }) {
  const [process, setProcess] = useState<string>("CNC Milling");
  const [query, setQuery] = useState("");
  const [axis, setAxis] = useState("all");
  const [documentedEnvelope, setDocumentedEnvelope] = useState(false);
  const [publicReference, setPublicReference] = useState(false);
  const [page, setPage] = useState(1);
  const [layout, setLayout] = useState<"directory" | "cards">("directory");
  const counts = useMemo(() => Object.fromEntries(explorerProcesses.map(value => [value, equipment.filter(item => item.process === value).length])), [equipment]);
  const results = useMemo(() => filterExplorerEquipment(equipment, { process, query, axis, documentedEnvelope, publicReference }), [equipment, process, query, axis, documentedEnvelope, publicReference]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(results.length / pageSize)));
  const visible = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = query !== "" || axis !== "all" || documentedEnvelope || publicReference;
  const reset = () => { setQuery(""); setAxis("all"); setDocumentedEnvelope(false); setPublicReference(false); setPage(1); };
  const selectProcess = (value: string) => { setProcess(value); setAxis("all"); setPage(1); };
  const changePage = (value: number) => { setPage(value); document.getElementById("equipment-results")?.scrollIntoView({ block: "start" }); };
  return <div className={styles.explorer}>
    <header className={styles.hero}>
      <div><h1>Equipment explorer</h1><span>Explore working capacity, precision and technical evidence across the network.</span></div>
      <Link href="/requests/new" className={styles.reviewLink}>Get your part reviewed<ArrowRight size={16} aria-hidden="true" /></Link>
    </header>

    <div className={styles.readingGuide}>
      <div><Gauge size={19} aria-hidden="true" /><p><strong>Supplier-reported capacity.</strong> Final part suitability depends on your drawing, material, fixturing and inspection requirements.</p></div>
      <details><summary>How to read the specifications<ChevronDown size={15} aria-hidden="true" /></summary><div className={styles.guideBody}>
        <p><strong>Envelope:</strong> preserve the listed basis. A 3-axis envelope, rotary work area, bar diameter and sheet capacity describe different limits. Missing dimensions stay unlisted.</p>
        <p><strong>Precision:</strong> positioning accuracy, repeatability and machining tolerance describe different claims. Confirm drawing tolerances during RFQ review.</p>
        <p><strong>Evidence:</strong> open Specifications & sources for the network record and any public technical references. Catalog coverage and listed quantities are not live machine availability.</p>
      </div></details>
    </div>

    <section aria-label="Browse equipment by process" className={styles.processSection}>
      <div className={styles.sectionHeading}><h2>Start with your process</h2><button type="button" onClick={() => selectProcess("all")} aria-pressed={process === "all"}>All equipment <span>{equipment.length}</span><ArrowRight size={14} aria-hidden="true" /></button></div>
      <div className={styles.processGrid}>{explorerProcesses.map(value => { const item = processCopy[value]; const Icon = item.icon; return <button key={value} type="button" aria-pressed={process === value} onClick={() => selectProcess(value)}><Icon size={21} aria-hidden="true" /><strong>{item.label}</strong><span>{counts[value]} records</span></button>; })}</div>
    </section>

    <section id="equipment-results" aria-labelledby="equipment-results-heading" className={styles.resultsSection}>
      <div className={styles.resultsHeader}><div><h2 id="equipment-results-heading">{process === "all" ? "All network equipment" : process}</h2><p>{process === "all" ? "Documented machines and supporting equipment across the network" : processCopy[process as ExplorerProcess].description}</p></div><span aria-live="polite">{results.length} {results.length === 1 ? "record" : "records"}</span></div>
      <div className={styles.filters}>
        <label className={styles.search}><Search size={17} aria-hidden="true" /><span className="sr-only">Search equipment</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search model, control or specification" /></label>
        {process === "CNC Milling" && <label className={styles.axis}><SlidersHorizontal size={15} aria-hidden="true" /><span className="sr-only">Milling configuration</span><select value={axis} onChange={event => { setAxis(event.target.value); setPage(1); }}><option value="all">All configurations</option><option value="3-axis">3-axis</option><option value="4-axis">4-axis</option><option value="5-axis">5-axis</option><option value="3+2">3+2</option></select></label>}
        <div className={styles.filterOptions}><label><input type="checkbox" checked={documentedEnvelope} onChange={event => { setDocumentedEnvelope(event.target.checked); setPage(1); }} />Listed working capacity</label><label><input type="checkbox" checked={publicReference} onChange={event => { setPublicReference(event.target.checked); setPage(1); }} />Public technical reference</label>{hasFilters && <button type="button" onClick={reset}><X size={14} aria-hidden="true" />Clear filters</button>}</div>
      </div>
      <div className={styles.resultsTools}><div className={styles.listNote}><FileText size={14} aria-hidden="true" /><span>Values retain their documented basis. Open a record to inspect its specifications and references.</span></div><div className={styles.viewSwitch} role="group" aria-label="Equipment layout"><button type="button" aria-pressed={layout === "directory"} onClick={() => setLayout("directory")}>Directory</button><button type="button" aria-pressed={layout === "cards"} onClick={() => setLayout("cards")}>Cards</button></div></div>
      {visible.length > 0 ? <div className={`${styles.machineGrid} ${layout === "directory" ? styles.directory : ""}`}>{visible.map(machine => <MachineCard key={machine.id} machine={machine} />)}</div> : <div className={styles.empty}><Search size={25} aria-hidden="true" /><h3>No equipment matches these filters</h3><p>Try a model or specification, broaden your process, or send your requirements for review.</p><button type="button" onClick={() => { reset(); setProcess("all"); }}>Show all equipment</button><Link href="/requests/new">Get your part reviewed<ArrowRight size={15} aria-hidden="true" /></Link></div>}
      {results.length > pageSize && <nav aria-label="Equipment result pages" className={styles.pagination}><span>Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, results.length)} of {results.length}</span><div><button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {Math.ceil(results.length / pageSize)}</span><button type="button" disabled={currentPage * pageSize >= results.length} onClick={() => changePage(currentPage + 1)}>Next<ArrowRight size={14} aria-hidden="true" /></button></div></nav>}
    </section>
    <section className={styles.bottomCta} aria-label="Confirm manufacturing suitability"><div className={styles.ctaIcon}><ArrowDown size={24} aria-hidden="true" /></div><div><h2>Your drawing makes the final call.</h2><p>Send your CAD, material, quantities and critical tolerances. Lattice will review the manufacturing route and inspection requirements for your job.</p></div><Link href="/requests/new">Request a quote<ArrowRight size={16} aria-hidden="true" /></Link></section>
  </div>;
}
