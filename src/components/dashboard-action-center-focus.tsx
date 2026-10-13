"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

/** Give the summary card a visible destination, including on repeated clicks. */
export function DashboardActionCenterFocus({ children }: { children: ReactNode }) {
  const highlight = useRef<Animation | null>(null);

  useEffect(() => () => highlight.current?.cancel(), []);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element) || !event.target.closest("[data-action-center-trigger]")) return;

    const actionCenter = event.currentTarget.querySelector<HTMLElement>("#action-center");
    if (!actionCenter) return;
    event.preventDefault();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bounds = actionCenter.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
      actionCenter.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "nearest" });
    }
    actionCenter.focus({ preventScroll: true });

    highlight.current?.cancel();
    const emphasized = { backgroundColor: "#fffbeb", boxShadow: "0 0 0 2px #fbbf24" };
    highlight.current = actionCenter.animate(
      reducedMotion
        ? [emphasized, emphasized]
        : [emphasized, { ...emphasized, offset: 0.65 }, { backgroundColor: "#ffffff", boxShadow: "0 0 0 0px transparent" }],
      { duration: 1800, easing: "ease-out" },
    );
  }

  return <div className="mx-auto max-w-[1400px] space-y-6" onClickCapture={handleClick}>{children}</div>;
}
