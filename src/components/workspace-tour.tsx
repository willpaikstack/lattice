"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, Clock3, Mail, RotateCcw, X } from "lucide-react";
import { WORKSPACE_TOUR_LAST_STEP, workspaceTourChapters, workspaceTourSteps } from "@/lib/workspace-tour";
import { workspaceTourPosition } from "@/lib/workspace-tour-position";
import { useWorkspaceTourInteractionGuards } from "./workspace-tour-interaction-guards";
import { LatticeBrand } from "./lattice-brand";
import s from "./workspace-tour.module.css";

export type TourDestination = "request" | "dashboard";

type Props = {
  step: number;
  name: string;
  pathname: string;
  pending: boolean;
  error: string;
  preview?: boolean;
  onStep: (step: number, navigate?: boolean) => void;
  onSkip: () => void;
  onNext: () => void;
  onDismissError: () => void;
};

/** The guide is a portal over the existing app, with no replacement workspace. */
export function WorkspaceTour({ step, name, pathname, pending, error, preview, onStep, onSkip, onNext, onDismissError }: Props) {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [targetReady, setTargetReady] = useState(false);
  // Progress can be saved before navigation commits. Present the next step only
  // when its real route and visible anchor can be measured together.
  const [presentedStep, setPresentedStep] = useState(step);
  const [placement, setPlacement] = useState<{ left: number; top: number } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const coach = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = workspaceTourSteps[step];
  const presented = workspaceTourSteps[presentedStep];
  const waitingForPage = step !== presentedStep;
  const controlsPending = pending || waitingForPage;
  const callbacks = useRef({ onStep, onSkip, pending });
  useEffect(() => { callbacks.current = { onStep, onSkip, pending }; });
  useWorkspaceTourInteractionGuards({ step: presentedStep, coach, pending, onSkip });

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    if (!mounted || step === 0) return;
    let frame = 0;
    let activeTarget: HTMLElement | null = null;
    const originalFocus = document.activeElement;
    const headingElement = heading.current;
    function findTarget() {
      for (const selector of current.selector.split(", ")) {
        const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector));
        const match = candidates.find(element => {
          const r = element.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && !element.closest('[inert], [aria-hidden="true"]') && getComputedStyle(element).visibility !== "hidden";
        });
        if (match) return match;
      }
      return null;
    }
    function measure() {
      const destinationReady = pathname === current.path && (step !== 3 || Boolean(document.querySelector('[data-workspace-tour="quotes"]'))) && (step !== 4 || Boolean(document.querySelector('[data-workspace-tour="orders"]')));
      const element = destinationReady ? findTarget() : null;
      setTargetReady(Boolean(element));
      if (!element) return;
      setPresentedStep(step);
      if (element !== activeTarget) {
        element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        resize.observe(element);
      }
      activeTarget = element;
      const r = element.getBoundingClientRect();
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const rect = { top: Math.max(8, r.top - 5), left: Math.max(8, r.left - 5), width: Math.min(r.width + 10, vw - 16), height: Math.min(r.height + 10, vh - 16) };
      setTarget(previous => JSON.stringify(previous) === JSON.stringify(rect) ? previous : rect);
      const position = workspaceTourPosition(r, {
        width: coach.current?.offsetWidth || Math.min(340, vw - 32),
        height: coach.current?.offsetHeight || Math.min(300, vh - 32),
      }, { width: vw, height: vh }, step === 2);
      setPlacement(previous => previous?.left === position.left && previous.top === position.top ? previous : { left: position.left, top: position.top });
    }
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    function clicked(event: MouseEvent) {
      if (!current.clickToAdvance || callbacks.current.pending || !activeTarget || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.target instanceof Node && activeTarget.contains(event.target)) {
        // Observe the real control. Its own handler retains normal navigation/help behavior.
        callbacks.current.onStep(step + 1, false);
      }
    }
    function keydown(event: KeyboardEvent) { if (event.key === "Escape" && !callbacks.current.pending) callbacks.current.onSkip(); }
    const observer = new MutationObserver(update);
    observer.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "style", "class", "aria-hidden", "inert"] });
    const resize = new ResizeObserver(update);
    resize.observe(document.documentElement);
    if (coach.current) resize.observe(coach.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    document.addEventListener("click", clicked, true);
    document.addEventListener("keydown", keydown);
    measure();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      document.removeEventListener("click", clicked, true); document.removeEventListener("keydown", keydown);
      if (document.activeElement === headingElement && originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
    };
  }, [mounted, step, current.selector, current.path, current.clickToAdvance, pathname]);

  useLayoutEffect(() => {
    if (mounted && step > 0 && presentedStep === step) heading.current?.focus({ preventScroll: true });
  }, [mounted, step, presentedStep]);

  if (!mounted) return null;
  if (step === 0) return createPortal(<TourWelcome name={name} preview={preview} pending={pending} error={error} onStart={() => onStep(1)} onSkip={onSkip} onDismissError={onDismissError} />, document.body);
  return createPortal(<div className={s.layer}>
    <svg className={s.backdrop} aria-hidden="true" data-workspace-tour-backdrop="">
      <defs><mask id={`${id}-backdrop`} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
        <rect x="0" y="0" width="100%" height="100%" fill="white" />
        {target && <rect className={s.backdropCutout} data-ready={targetReady} x={target.left} y={target.top} width={target.width} height={target.height} rx="9" fill="black" />}
      </mask></defs>
      <rect x="0" y="0" width="100%" height="100%" fill="#17251d" fillOpacity={0.1333333333} mask={`url(#${id}-backdrop)`} />
    </svg>
    {target && <div className={s.spotlight} data-ready={targetReady} aria-hidden="true" style={target} />}
    <div className={s.coach} ref={coach} style={{ left: placement?.left ?? 16, top: placement?.top ?? 16, visibility: placement ? "visible" : "hidden" }} role="dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
      <div className={s.coachTop}><span>{preview ? "Tour preview" : "Workspace tour"} · {presentedStep} of {WORKSPACE_TOUR_LAST_STEP}</span><button type="button" disabled={pending} className={s.close} onClick={onSkip} aria-label="Skip tour"><X size={16} aria-hidden="true" /></button></div>
      <nav aria-label="Tour chapters" className={s.chapters}>{workspaceTourChapters.map(chapter => <button type="button" key={chapter.label} disabled={controlsPending} aria-current={presentedStep >= chapter.step && presentedStep <= chapter.end ? "step" : undefined} onClick={() => onStep(chapter.step)}>{chapter.label}</button>)}</nav>
      <h2 ref={heading} tabIndex={-1} id={`${id}-title`}>{presented.title}</h2><p id={`${id}-description`}>{presented.text}</p>
      {!target && <p className={s.location} role="status">{pathname !== current.path ? "Continue to the next location in your workspace." : "The page is loading. You can continue with the tour controls below."}</p>}
      {error && <ErrorMessage error={error} onDismiss={onDismissError} />}
      <div className={s.actions}><button type="button" className={s.back} disabled={controlsPending} onClick={() => onStep(presentedStep - 1)}><ArrowLeft size={14} aria-hidden="true" />Back</button><button type="button" className={s.primary} disabled={controlsPending} onClick={onNext}>{waitingForPage ? presented.nextLabel : pathname !== current.path ? "Continue tour" : presented.nextLabel}<ArrowRight size={14} aria-hidden="true" /></button></div>
      <div className={s.footer}><button type="button" disabled={pending} onClick={onSkip}>Skip tour</button><span role="status">{waitingForPage ? "Loading the next page…" : pending ? "Finishing tour…" : preview ? "Tour preview" : "Workspace tour"}</span></div>
    </div>
  </div>, document.body);
}

function TourWelcome({ name, preview, pending, error, onStart, onSkip, onDismissError }: { name: string; preview?: boolean; pending: boolean; error: string; onStart: () => void; onSkip: () => void; onDismissError: () => void }) {
  const dialog = useNativeTourDialog();
  const id = useId();
  return <dialog ref={dialog} className={s.welcome} aria-labelledby={id} onCancel={event => { event.preventDefault(); if (!pending) onSkip(); }}><div className={s.welcomeHeader}><LatticeBrand /><button type="button" className={s.close} onClick={onSkip} disabled={pending} aria-label="Skip tour"><X size={17} /></button></div><p className={s.eyebrow}>{preview ? "In-app tour preview" : "Your workspace"}</p><h2 id={id}>Welcome to Lattice OS, {name.trim().split(/\s+/)[0] || "there"}</h2><p>Here’s a quick look around your workspace. We’ll show you where to request a quote, review pricing, track your orders and get help.</p><div className={s.time}><Clock3 size={15} aria-hidden="true" />About two minutes · right here in your workspace</div>{error && <ErrorMessage error={error} onDismiss={onDismissError} />}<button type="button" className={s.primary} onClick={onStart} disabled={pending}>Show me around<ArrowRight size={16} aria-hidden="true" /></button><button type="button" className={s.skip} onClick={onSkip} disabled={pending}>Explore on my own</button></dialog>;
}

function useNativeTourDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return ref;
}

function ErrorMessage({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return <div className={s.error}><p role="alert">{error}</p><button type="button" onClick={onDismiss}>Close without saving</button></div>;
}

export function CustomerTourHelp({ pending, error, onReplay, onClose, onDismissError, onFinish, onAddAddresses, needsAddressSetup }: { pending: boolean; error: string; onReplay: () => void; onClose: () => void; onDismissError: () => void; onFinish?: () => void; onAddAddresses?: () => void; needsAddressSetup?: boolean }) {
  const dialog = useNativeTourDialog();
  const id = useId();
  return <dialog ref={dialog} className={s.helpDialog} aria-labelledby={id} onCancel={event => { event.preventDefault(); if (!pending) onClose(); }}>
    <div className={s.welcomeHeader}><LatticeBrand /><button type="button" disabled={pending} className={s.close} onClick={onClose} aria-label={onFinish ? "Finish tour" : "Close Help"}><X size={18} /></button></div>
    <p className={s.eyebrow}>{onFinish ? "Workspace tour complete" : "Lattice · Customer care"}</p>
    <h2 id={id}>{onFinish ? "You’re ready to get started." : "Need a hand?"}</h2>
    <p>{onFinish && needsAddressSetup ? "Add your shipping and billing addresses now, or add them later in Account Settings." : onFinish ? "Contact our team, replay this introduction, or finish the tour and start using your workspace." : "Talk with our team or get a quick refresher on your workspace."}</p>
    <a className={s.helpAction} href="mailto:support@latticeos.co"><Mail size={19} /><span><strong>Contact our team</strong><small>support@latticeos.co</small></span><ArrowRight size={16} /></a>
    <button type="button" disabled={pending} className={s.helpAction} onClick={onReplay}><RotateCcw size={18} /><span><strong>Replay workspace tour</strong><small>Request Quote, Quotes, Orders and Help</small></span><ArrowRight size={16} /></button>
    {error && <ErrorMessage error={error} onDismiss={onDismissError} />}
    {onFinish && (needsAddressSetup && onAddAddresses ? <>
      <button type="button" className={s.finish} disabled={pending} onClick={onAddAddresses}>Add shipping and billing addresses now<ArrowRight size={16} aria-hidden="true" /></button>
      <button type="button" className={s.skip} disabled={pending} onClick={onFinish}>Add later</button>
    </> : <button type="button" className={s.finish} disabled={pending} onClick={onFinish}><Check size={16} />Finish tour and start using your workspace</button>)}
  </dialog>;
}
