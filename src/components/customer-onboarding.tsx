"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Clock, X } from "lucide-react";
import { saveCustomerOnboarding } from "@/app/(workspace)/onboarding/actions";
import { LatticeMarkIcon } from "./lattice-brand";
import s from "./customer-onboarding-draft.module.css";

const stops = [
  { title: "Start with your part files.", text: "Use Request Quote to upload CAD and drawings, configure each part, and send your manufacturing request.", selector: 'a[href="/requests/new"]' },
  { title: "Your quotes, in one place.", text: "Resume requests, review pricing and lead time, and purchase an issued quote by credit card.", selector: 'a[href="/quotes"]' },
  { title: "Follow your work through delivery.", text: "Orders show production milestones, quality documents, and shipping updates. Open an order whenever you need help.", selector: 'a[href="/orders"]' },
  { title: "You can always come back here.", text: "Help lets you replay this tour and contact support@latticeos.co.", selector: '[data-onboarding-help]' },
];
export type CustomerOnboardingState = { step: number; completed: boolean; name: string; company: string };
export function CustomerOnboarding({ initial }: { initial: CustomerOnboardingState }) {
  const pathname = usePathname();
  const [step, setStep] = useState(initial.step);
  const [open, setOpen] = useState(!initial.completed);
  const [help, setHelp] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<DOMRect | null>(null);
  const visible = open && !pathname.startsWith("/account/") && !pathname.startsWith("/admin/");
  useEffect(() => {
    const replay = () => setHelp(true);
    window.addEventListener("lattice-customer-help", replay);
    return () => window.removeEventListener("lattice-customer-help", replay);
  }, []);
  useEffect(() => {
    if (!visible && !help) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const measure = () => {
      const elements = step > 0 ? Array.from(document.querySelectorAll(stops[step - 1].selector)) : [];
      const element = elements.find((candidate) => candidate.getBoundingClientRect().width > 0);
      setTarget(element?.getBoundingClientRect() ?? null);
    };
    measure(); window.addEventListener("resize", measure); window.addEventListener("scroll", measure, true);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); previous?.focus(); };
  }, [visible, help, step]);
  function persist(next: number, complete = false) {
    startTransition(async () => {
      setError("");
      try { await saveCustomerOnboarding(next, complete); setStep(next); setOpen(!complete); setHelp(false); }
      catch { setError("Your progress could not be saved. Please try again."); }
    });
  }
  if (!visible && !help) return null;
  return <div className={s.root}>
    {target && visible && step > 0 && <div aria-hidden="true" className={s.spotlight} style={{ position: "fixed", zIndex: 1001, top: target.top, left: target.left, width: target.width, height: target.height }} />}
    <div className={s.welcomeVeil} style={{ position: "fixed", zIndex: 1002, background: step > 0 && !help ? "transparent" : undefined }}>
      <div aria-modal="true" aria-labelledby="customer-tour-title" role="dialog" tabIndex={-1} ref={dialog} className={s.welcome} onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) { if (help) setHelp(false); else persist(step, true); }
        if (event.key === "Tab") {
          const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? []);
          if (!controls.length) { event.preventDefault(); return; }
          const first = controls[0], last = controls.at(-1)!;
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
        }
      }}>
        <div className={s.welcomeArtwork}><LatticeMarkIcon /><span>Request</span><i /><span>Quote</span><i /><span>Order</span></div>
        <p className={s.eyebrow}>{help ? "Workspace help" : step === 0 ? initial.company : `Workspace tour · ${step} of 4`}</p>
        <h2 id="customer-tour-title">{help ? "How can we help?" : step === 0 ? `Welcome to Lattice, ${initial.name.split(" ")[0]}.` : stops[step - 1].title}</h2>
        <p>{help ? "Get familiar with your workspace or contact the Lattice team." : step === 0 ? "Submit manufacturing requests, review quotes, and follow your orders in one place." : stops[step - 1].text}</p>
        {error && <p role="alert">{error}</p>}
        {help ? <><button disabled={pending} className={s.primary} onClick={() => persist(0)}>Replay workspace tour</button><a className={s.textButton} href="mailto:support@latticeos.co">Contact support@latticeos.co</a><button className={s.textButton} onClick={() => setHelp(false)}><X size={14} />Close</button></> : <><div className={s.time}><Clock size={14} />About one minute · progress saves automatically</div><button disabled={pending} className={s.primary} onClick={() => persist(step === 4 ? 4 : step + 1, step === 4)}>{step === 0 ? "Show me around" : step === 4 ? "Start using Lattice" : "Next"}<ArrowRight size={15} /></button>{step > 0 && <button disabled={pending} className={s.textButton} onClick={() => persist(step - 1)}>Back</button>}<button disabled={pending} className={s.textButton} onClick={() => persist(step, true)}>Skip tour</button></>}
      </div>
    </div>
  </div>;
}
