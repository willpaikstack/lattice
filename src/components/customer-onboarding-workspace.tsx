"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

const selectors = {
  "Request Quote": 'a[href="/requests/new"]',
  Quotes: 'a[href="/quotes"]',
  Orders: 'a[href="/orders"]',
  Help: '[data-onboarding-help]',
};

/** Sends only synthetic preview geometry/actions to its parent, never account data. */
export function CustomerOnboardingWorkspace({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const parentOrigin = useRef<string | null>(null);

  function send(payload: object) {
    if (parentOrigin.current && window.parent !== window) window.parent.postMessage(payload, parentOrigin.current);
  }

  useEffect(() => {
    if (document.referrer) parentOrigin.current = new URL(document.referrer).origin;
    const surface = root.current;
    if (!surface) return;
    let frame = 0;
    let ready = false;
    let active = true;
    function visibleTarget(name: keyof typeof selectors) {
      return [...surface!.querySelectorAll<HTMLElement>(selectors[name])].find((element) => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
    }
    function measure() {
      const targets = Object.fromEntries(Object.keys(selectors).map((name) => {
        const element = visibleTarget(name as keyof typeof selectors);
        const rect = element?.getBoundingClientRect();
        return [name, rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null];
      }));
      send({ type: "lattice-onboarding-layout", targets, ready, desktop: window.matchMedia("(min-width: 1024px)").matches });
    }
    function update() { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); }
    function receive(event: MessageEvent) {
      if (event.source !== window.parent || event.origin !== parentOrigin.current ) return;
      if (event.data?.type === "lattice-onboarding-measure") { update(); return; }
      if (event.data?.type !== "lattice-onboarding-target") return;
      const name = event.data.target;
      if (typeof name === "string" && Object.hasOwn(selectors, name)) visibleTarget(name as keyof typeof selectors)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      update();
    }
    function help() { send({ type: "lattice-onboarding-action", href: "help" }); }
    const observer = new ResizeObserver(update);
    observer.observe(surface);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("message", receive);
    window.addEventListener("lattice-preview-help", help);
    update();
    // Reveal the entire parent composition only after this document and its
    // fonts have loaded, so the welcome cannot precede the real workspace.
    function loaded() {
      void document.fonts.ready.then(() => {
        if (!active) return;
        ready = true;
        update();
      });
    }
    if (document.readyState === "complete") loaded();
    else window.addEventListener("load", loaded, { once: true });
    return () => { active = false; window.removeEventListener("load", loaded); cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); window.removeEventListener("message", receive); window.removeEventListener("lattice-preview-help", help); };
  }, []);

  return <div ref={root} onClickCapture={(event) => {
    const target = event.target as HTMLElement;
    if (target.closest("button")?.textContent?.trim() === "Sign Out") {
      event.preventDefault(); event.stopPropagation(); send({ type: "lattice-onboarding-action", href: "/api/logout" }); return;
    }
    const anchor = target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor) return;
    event.preventDefault(); event.stopPropagation();
    send({ type: "lattice-onboarding-action", href: anchor.getAttribute("href") });
  }} onAuxClickCapture={(event) => event.preventDefault()} onContextMenu={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }} onDragStartCapture={(event) => event.preventDefault()}>
    <AppShell onboardingPreview sessionRole="customer" sessionUser={{ name: "Carmen Pascuito", email: "carmen@acme.example" }}>{children}</AppShell>
  </div>;
}
