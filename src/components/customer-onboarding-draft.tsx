"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { ArrowRight, ArrowLeft, Check, FileText, Package, CircleHelp, ShieldCheck, Mail, MapPin, Play, RotateCcw, Maximize2, Minimize2, X, Layers, Eye, EyeOff } from "lucide-react";
import { LatticeBrand, LatticeMarkIcon } from "@/components/lattice-brand";
import { CANADIAN_PROVINCES } from "@/lib/canadian-provinces";
import { US_STATES } from "@/lib/us-states";
import s from "./customer-onboarding-draft.module.css";

const screens = ["Invitation", "Sign in", "Password", "Shipping", "Billing", "Welcome", "Tour", "Workspace"] as const;
type Screen = typeof screens[number];
const stops = [
  { target: "Request Quote", icon: FileText, title: "Start with your manufacturing request", body: "Add CAD files, quantities, and requirements here. Lattice reviews your RFQ and prepares a quote for you.", note: "A request starts the conversation. No files or submission are needed for this tour." },
  { target: "Quotes", icon: Layers, title: "Follow requests and review quotes", body: "Find your submitted RFQs and the quotes Lattice prepares here. Open a record to review its details and next steps.", note: "This is where a customer follows the request through review and receives a quote." },
  { target: "Orders", icon: Package, title: "Keep track of work in progress", body: "Once an order is placed, follow its production updates, documents, and shipping details here.", note: "Future-tense copy works naturally when a new workspace has no orders." },
  { target: "Help", icon: CircleHelp, title: "Reach the Lattice team", body: "Contact us when you need a hand. You can also revisit how Lattice works or replay this introduction here.", note: "Help and replay are proposed additions. Finishing returns to the empty dashboard." },
];

function Primary({ children, onClick, type = "button" }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit" }) {
  return <button className={s.primary} type={type} onClick={onClick}>{children}<ArrowRight size={16} aria-hidden="true" /></button>;
}

function Field({ label, value, onChange, type = "text", autoComplete, placeholder }: { label: string; value: string; onChange?: (value: string) => void; type?: string; autoComplete?: string; placeholder?: string }) {
  return <label className={s.field}><span>{label}</span><input type={type} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} readOnly={!onChange} autoComplete={autoComplete} placeholder={placeholder} /></label>;
}

/** Wait-mode presence keeps the old content visible while it fades out. */
function Fade({ children, enter = 0.38, leave = 0.18, lift = 6, focusHeading = false, ready = true, elementRef, onSettled, ...props }: HTMLMotionProps<"div"> & { enter?: number; leave?: number; lift?: number; focusHeading?: boolean; ready?: boolean; elementRef?: RefObject<HTMLDivElement | null>; onSettled?: () => void }) {
  const reducedMotion = useReducedMotion();
  const present = useIsPresent();
  const node = useRef<HTMLDivElement>(null);
  return <motion.div {...props} ref={(element) => { node.current = element; if (elementRef) elementRef.current = element; }}
    inert={!present || !ready ? true : undefined} aria-hidden={!present || !ready ? true : props["aria-hidden"]}
    initial={{ opacity: 0, y: reducedMotion ? 0 : lift }}
    animate={{ opacity: ready ? 1 : 0, y: 0, transition: { duration: reducedMotion ? 0 : enter, ease: [0.22, 1, 0.36, 1] } }}
    exit={{ opacity: 0, y: 0, transition: { duration: reducedMotion ? 0 : leave, ease: "easeOut" } }}
    onAnimationComplete={() => {
      if (!present || !ready) return;
      if (focusHeading) node.current?.querySelector<HTMLElement>("[data-screen-heading]")?.focus({ preventScroll: true });
      onSettled?.();
    }}>{children}</motion.div>;
}

type TargetBox = { left: number; top: number; width: number; height: number };

export function CustomerOnboardingDraft({ workspacePreviewUrl = "/customer-onboarding-workspace" }: { workspacePreviewUrl?: string }) {
  const [screen, setScreen] = useState<Screen>("Invitation");
  const [stop, setStop] = useState(0);
  const [full, setFull] = useState(false);
  const [help, setHelp] = useState(false);
  const [status, setStatus] = useState("");
  const [existing, setExisting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [address, setAddress] = useState({ contact: "Carmen Pascuito", street: "125 Industrial Way", street2: "", city: "Cleveland", region: "OH", zip: "44114", country: "United States" });
  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState({ contact: "Accounts payable", street: "125 Industrial Way", street2: "", city: "Cleveland", region: "OH", zip: "44114", country: "United States" });
  const [cardRevision, setCardRevision] = useState(0);
  const [position, setPosition] = useState({ top: 150, left: 266, arrow: 40 });
  const [layout, setLayout] = useState<{ targets: Record<string, TargetBox | null>; desktop: boolean }>({ targets: {}, desktop: false });
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const workspaceFrame = useRef<HTMLIFrameElement>(null);
  const activeTour = screen === "Tour";
  const workspace = activeTour || screen === "Welcome" || screen === "Workspace";

  function go(next: Screen) {
    if (!["Welcome", "Tour", "Workspace"].includes(next)) { setWorkspaceReady(false); setLayout({ targets: {}, desktop: false }); }
    setScreen(next); setHelp(false); setStatus(""); setExpired(false);
    if (next === "Tour" && window.matchMedia("(max-width: 760px)").matches) {
      requestAnimationFrame(() => stage.current?.scrollIntoView({ block: "start", behavior: "instant" }));
    }
  }
  function finish(skipped = false) { setScreen("Workspace"); setHelp(false); setStatus(skipped ? "Introduction skipped. You can replay it from Help." : "You’re ready. Replay the introduction anytime from Help."); }
  function startTour() { setStop(0); go("Tour"); }

  useEffect(() => {
    function receive(event: MessageEvent) {
      const frame = workspaceFrame.current;
      if (!workspace || !frame || event.source !== frame.contentWindow || event.origin !== new URL(workspacePreviewUrl, window.location.href).origin) return;
      if (event.data?.type === "lattice-onboarding-layout") {
        const incoming = event.data.targets;
        if (!incoming || typeof incoming !== "object") return;
        const targets: Record<string, TargetBox | null> = {};
        for (const item of stops) {
          const box = incoming[item.target];
          targets[item.target] = box && [box.left, box.top, box.width, box.height].every((value) => typeof value === "number" && Number.isFinite(value)) ? box : null;
        }
        setLayout({ targets, desktop: event.data.desktop === true });
        setWorkspaceReady(event.data.ready === true);
      } else if (event.data?.type === "lattice-onboarding-action") {
        if (event.data.href === "help") setHelp(true);
        else setStatus("Preview only — this action is available in the customer workspace after onboarding.");
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [workspacePreviewUrl, workspace]);

  useEffect(() => {
    if (!workspace) return;
    workspaceFrame.current?.contentWindow?.postMessage({ type: "lattice-onboarding-measure" }, new URL(workspacePreviewUrl, window.location.href).origin);
  }, [workspace, workspacePreviewUrl]);

  useEffect(() => {
    if (!activeTour || !workspaceReady) return;
    workspaceFrame.current?.contentWindow?.postMessage({ type: "lattice-onboarding-target", target: stops[stop].target }, new URL(workspacePreviewUrl, window.location.href).origin);
  }, [activeTour, stop, workspacePreviewUrl, workspaceReady]);

  useEffect(() => {
    if (!activeTour || !stage.current) return;
    const element = layout.targets[stops[stop].target];
    if (!element) return;
    const surface = stage.current;
    function update() {
      if (!element) return;
      const height = card.current?.offsetHeight ?? 300;
      const width = surface.clientWidth;
      const top = Math.max(16, Math.min(layout.desktop ? element.top - 28 : element.top + element.height + 22, surface.clientHeight - height - 20));
      const left = layout.desktop ? element.left + element.width + 22 : Math.max(16, Math.min(element.left, width - 336));
      setPosition({ left, top, arrow: Math.max(20, Math.min(element.top + element.height / 2 - top - 6, height - 30)) });
    }
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(surface);
    if (card.current) observer.observe(card.current);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [activeTour, stop, full, layout, cardRevision]);

  function addressFields(values: typeof address, change: typeof setAddress) {
    const canadian = values.country === "Canada";
    const regions = canadian ? CANADIAN_PROVINCES : US_STATES;
    return <div className={s.fields}>
      <Field label="Contact name" value={values.contact} onChange={(contact) => change({ ...values, contact })} autoComplete="off" />
      <Field label="Street address" value={values.street} onChange={(street) => change({ ...values, street })} autoComplete="off" />
      <Field label="Address 2 (optional)" value={values.street2} onChange={(street2) => change({ ...values, street2 })} placeholder="Building, suite, office, etc." autoComplete="off" />
      <div className={s.fieldRow}><Field label="City" value={values.city} onChange={(city) => change({ ...values, city })} /><label className={s.field}><span>{canadian ? "Province / territory" : "State"}</span><select value={values.region} onChange={(event) => change({ ...values, region: event.target.value })}><option value="" disabled>{canadian ? "Select province / territory" : "Select state"}</option>{regions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label></div>
      <div className={s.fieldRow}><Field label="Postal code" value={values.zip} onChange={(zip) => change({ ...values, zip })} /><label className={s.field}><span>Country</span><select value={values.country} onChange={(event) => change({ ...values, country: event.target.value, region: "" })}><option value="United States">United States</option><option value="Canada">Canada</option></select></label></div>
    </div>;
  }

  return <div className={`${s.root} ${full ? s.full : ""}`}>
    <header className={s.reviewHeader}>
      <div><p className={s.eyebrow}>Customer experience · Initial draft</p><h1>Joining Lattice</h1><p>A considered arrival, from invitation to your first look around.</p></div>
      <div className={s.reviewActions}><button type="button" onClick={() => { go("Invitation"); setStop(0); }}><RotateCcw size={15} />Restart</button><button type="button" onClick={() => setFull(!full)}>{full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}{full ? "Exit expanded view" : "Expand preview"}</button></div>
    </header>
    <div className={s.reviewBar}><nav aria-label="Preview screens">{screens.map((item, index) => <button type="button" key={item} aria-current={screen === item ? "step" : undefined} className={screen === item ? s.current : ""} onClick={() => { go(item); if (item === "Tour") setStop(0); }}><span>{String(index + 1).padStart(2, "0")}</span>{item}</button>)}</nav><p>Sample company · No live account changes</p></div>
    <div ref={stage} className={`${s.stage} ${workspace ? s.workspaceStage : ""} ${activeTour ? s.workspaceTour : ""}`}>
      <AnimatePresence mode="wait" initial={false}>
      {!workspace ? <Fade key="arrival" className={s.arrival} lift={0}>
        <div className={s.arrivalHeader}><LatticeBrand /><span>Qualified manufacturing capacity</span></div>
        <AnimatePresence mode="wait" initial={false}>
        {screen === "Invitation" ? <Fade key="invitation" focusHeading><article className={s.email}>
          <div className={s.emailMeta}><Mail size={18} /><div><strong>You’re invited to Lattice</strong><span>Lattice OS &lt;support@latticeos.co&gt;</span></div><span>To Carmen</span></div>
          <div className={s.emailBody}><p className={s.eyebrow}>An invitation to your workspace</p><h2 data-screen-heading tabIndex={-1}>Welcome to Lattice,<br />Carmen.</h2><p>Your <strong>Acme Machining</strong> workspace is ready.</p><p>Submit manufacturing requests, review quotes, and follow your orders in one place. Our team coordinates qualified manufacturing partners to help you take on overflow and out-of-capability work.</p><div className={s.credential}><span>Sign-in email</span><strong>carmen@acme.example</strong><span>{existing ? "Use your existing sign-in method" : "Temporary password · valid for 72 hours"}</span>{!existing && <strong className={s.mono}>•••• •••• ••••</strong>}</div><Primary onClick={() => go("Sign in")}>Get started with Lattice</Primary><div className={s.attachment}><FileText size={19} /><div><strong>How Lattice works</strong><span>Your one-page guide · PDF attachment</span></div></div><p className={s.signoff}>We’re excited to have you on board.<br /><strong>The Lattice Team</strong></p></div>
        </article></Fade> : <Fade key="setup" className={s.setupLayout} focusHeading>
          <aside className={s.story}><p className={s.eyebrow}>Manufacturing, connected.</p><h2>More capacity.<br />Every detail<br /><span>considered.</span></h2><p>From your first request to the final shipment, one clear place to work with Lattice.</p><div className={s.storyPath}><span>Request</span><i /><span>Quote</span><i /><span>Delivery</span></div><div className={s.storyMark}><LatticeMarkIcon /></div></aside>
          <div className={s.formPanel}>
            <AnimatePresence mode="wait" initial={false}><Fade key={`${screen}-${expired}`} className={s.formContent} focusHeading>
            {expired ? <><ShieldCheck className={s.formIcon} /><p className={s.eyebrow}>Account access</p><h2 data-screen-heading tabIndex={-1}>Let’s refresh your invitation.</h2><p>This invitation needs to be refreshed. Contact Lattice and we’ll help you get access.</p><div className={s.supportAddress}>support@latticeos.co</div><Primary onClick={() => setExpired(false)}>Return to sign in</Primary></> : screen === "Sign in" ? <><ShieldCheck className={s.formIcon} /><p className={s.eyebrow}>Your invitation is ready</p><h2 data-screen-heading tabIndex={-1}>Sign in to Lattice.</h2><p>Use the email address that received your invitation.</p><form onSubmit={(e) => { e.preventDefault(); go("Password"); }}><Field label="Email address" value="carmen@acme.example" /><Field label={existing ? "Your sign-in method" : "Temporary password"} value={existing ? "Existing verified identity" : "Sample credential — preview only"} /><Primary type="submit">Continue</Primary></form><button className={s.textButton} type="button" onClick={() => setExpired(true)}>Need help with your invitation?</button></> : screen === "Password" ? <><ShieldCheck className={s.formIcon} /><p className={s.eyebrow}>One-time account setup</p><h2 data-screen-heading tabIndex={-1}>Make this account yours.</h2><p>Choose a personal password for your Lattice account.</p><form onSubmit={(e) => { e.preventDefault(); go("Shipping"); }}><Field label="Personal password" type={passwordVisible ? "text" : "password"} value="PreviewPassword" /><Field label="Confirm password" type={passwordVisible ? "text" : "password"} value="PreviewPassword" /><button className={s.textButton} type="button" onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? <EyeOff size={15} /> : <Eye size={15} />}{passwordVisible ? "Hide sample password" : "Show sample password"}</button><p className={s.requirement}><Check size={15} />At least 8 characters. Use a unique password.</p><Primary type="submit">Save and continue</Primary></form><small>Sample fields are read-only in this draft.</small></> : <><MapPin className={s.formIcon} /><div className={s.setupProgress}><span className={screen === "Shipping" ? s.activeStep : ""}>1 · Shipping</span><i /><span className={screen === "Billing" ? s.activeStep : ""}>2 · Billing</span></div><h2 data-screen-heading tabIndex={-1}>{screen === "Shipping" ? "Where should your work arrive?" : "Confirm your billing details."}</h2><p>Shared defaults for Acme Machining. Add them now, or finish this later.</p><form onSubmit={(e) => { e.preventDefault(); if (screen === "Shipping") { if (sameBilling) setBilling({ ...address, contact: "Accounts payable" }); go("Billing"); } else { go("Welcome"); } }}>
              {screen === "Billing" && <label className={s.checkbox}><input type="checkbox" checked={sameBilling} onChange={(e) => { setSameBilling(e.target.checked); if (e.target.checked) setBilling({ ...address, contact: "Accounts payable" }); }} />Use shipping address for billing</label>}
              {addressFields(screen === "Shipping" ? address : billing, screen === "Shipping" ? setAddress : setBilling)}
              <Primary type="submit">{screen === "Shipping" ? "Continue to billing" : "Save and enter workspace"}</Primary></form><div className={s.formFooter}>{screen === "Billing" && <button type="button" className={s.textButton} onClick={() => go("Shipping")}><ArrowLeft size={15} />Back</button>}<button type="button" className={s.textButton} onClick={() => { go("Welcome"); }}>Finish later</button></div></>}
            </Fade></AnimatePresence>
            <div className={s.formSupport}>Questions? <span>support@latticeos.co</span></div>
          </div>
        </Fade>}
        </AnimatePresence>
        <footer className={s.arrivalFooter}><span>Built for your next manufacturing opportunity.</span><span>Lattice OS</span></footer>
      </Fade> : <Fade key="workspace" ready={workspaceReady} className={s.workspaceSurface} enter={0.5} lift={0} focusHeading>
        <iframe ref={workspaceFrame} className={s.workspaceFrame} src={workspacePreviewUrl} title="Actual customer workspace with sample data" inert={screen === "Welcome" || activeTour ? true : undefined} />
        <AnimatePresence mode="wait" initial={false}>
        {screen === "Welcome" ? <Fade key="welcome" className={s.welcomeVeil} enter={0.5} leave={0.35} lift={0} focusHeading><div className={s.welcome} role="dialog" aria-labelledby="welcome-title" onKeyDown={(e) => { if (e.key === "Escape") finish(true); }}><div className={s.welcomeArtwork}><LatticeMarkIcon /><span>Request</span><i /><span>Quote</span><i /><span>Delivery</span></div><p className={s.eyebrow}>Acme Machining · Your workspace</p><h2 id="welcome-title" data-screen-heading tabIndex={-1}>Welcome to Lattice,<br />Carmen.</h2><p>Your workspace is ready. Here’s where to request a quote, follow your work, and reach our team.</p><div className={s.time}><Play size={14} />Four quick stops. About a minute.</div><Primary onClick={startTour}>Show me around</Primary><button type="button" className={s.textButton} onClick={() => finish(true)}>Skip introduction</button></div></Fade> : activeTour ? <Fade key="tour" className={s.tourLayer} enter={0.3} leave={0.35} lift={0} focusHeading><AnimatePresence initial={false}>{layout.targets[stops[stop].target] ? <Fade key={stop} className={s.spotlight} enter={0.3} leave={0.3} lift={0} style={{ left: layout.targets[stops[stop].target]!.left, top: layout.targets[stops[stop].target]!.top, width: layout.targets[stops[stop].target]!.width, height: layout.targets[stops[stop].target]!.height }}><span>{stop + 1}</span></Fade> : <Fade key="veil" className={s.tourVeil} lift={0} />}</AnimatePresence><AnimatePresence mode="wait" initial={false}><Fade focusHeading onSettled={() => setCardRevision((value) => value + 1)} className={`${s.tourCard} ${!layout.desktop ? s.compactTourCard : ""}`} elementRef={card} enter={0.3} leave={0.15} lift={4} style={{ "--card-top": `${position.top}px`, "--card-left": `${position.left}px`, "--arrow-top": `${position.arrow}px` } as CSSProperties} key={stop} role="dialog" aria-labelledby="tour-title" onKeyDown={(e) => { if (e.key === "Escape") finish(true); if (e.key === "Tab") { const buttons = card.current?.querySelectorAll<HTMLButtonElement>("button"); if (!buttons?.length) return; const first = buttons[0]; const last = buttons[buttons.length - 1]; if (e.shiftKey && (document.activeElement === first || document.activeElement === card.current?.querySelector("h2"))) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } }}><div className={s.tourMeta}><span>{stop + 1} of 4 · {stops[stop].target}</span><button type="button" aria-label="Skip tour" onClick={() => finish(true)}><X size={17} /></button></div><h2 id="tour-title" data-screen-heading tabIndex={-1}>{stops[stop].title}</h2><p>{stops[stop].body}</p><div className={s.tourProgress}>{stops.map((item, index) => <span key={item.target} className={index <= stop ? s.progressDone : ""} />)}</div><div className={s.tourActions}><button type="button" onClick={() => stop === 0 ? go("Welcome") : setStop(stop - 1)}><ArrowLeft size={15} />Back</button><Primary onClick={() => stop === 3 ? finish() : setStop(stop + 1)}>{stop === 3 ? "Finish tour" : "Next"}</Primary></div><button type="button" className={s.skip} onClick={() => finish(true)}>Skip tour</button></Fade></AnimatePresence></Fade> : help ? <Fade key="help" className={s.helpPanel} lift={0}><button className={s.close} type="button" aria-label="Close help" onClick={() => setHelp(false)}><X size={17} /></button><CircleHelp size={22} /><h3>How can we help?</h3><p>Reach the people coordinating your work.</p><div className={s.supportAddress}>support@latticeos.co</div><button type="button" onClick={startTour}><Play size={16} />Replay introduction</button><button type="button" onClick={() => { setHelp(false); setStatus("How it works is available in the customer resource navigation."); }}><FileText size={16} />How Lattice works</button></Fade> : null}
        </AnimatePresence>
        {screen === "Workspace" && status && <div className={s.toast} role="status"><Check size={17} />{status}</div>}
      </Fade>}
      </AnimatePresence>
    </div>
    <div className={s.draftOptions}><label className={s.checkbox}><input type="checkbox" checked={existing} onChange={(e) => setExisting(e.target.checked)} />Preview an existing verified sign-in</label><span>Interactive draft · synthetic details · progress resets on reload</span></div>
    <section className={s.storyboard}><div className={s.storyboardHeading}><div><p className={s.eyebrow}>Four-stop storyboard</p><h2>A small map of the workspace.</h2></div><button type="button" onClick={startTour}><Play size={15} />Play tour</button></div><div className={s.storyboardGrid}>{stops.map((item, index) => { const Icon = item.icon; return <button type="button" key={item.target} className={s.storyboardCard} onClick={() => { setStop(index); go("Tour"); stage.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}><div><span>0{index + 1}</span><Icon size={20} /></div><h3>{item.target}</h3><p>{item.body}</p><small>{item.note}</small><strong>Preview this stop <ArrowRight size={14} /></strong></button>; })}</div></section>
  </div>;
}
