"use client";

import { useLayoutEffect, type RefObject } from "react";

type Props = { step: number; coach: RefObject<HTMLDivElement | null>; pending: boolean; onSkip: () => void };
const quotesSelector = 'a[href="/quotes"]';

/** Tour-only locks: no underlying file chooser, upload handler or accidental workflow action. */
export function useWorkspaceTourUploadLock(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return;
    const inputs = new Map<HTMLInputElement, boolean>();
    const labels = new Map<HTMLLabelElement, { aria: string | null; marker: string | null }>();
    function restoreAttribute(element: Element, name: string, value: string | null) {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
    function lockControls() {
      for (const input of document.querySelectorAll<HTMLInputElement>('input[type="file"]')) {
        if (!inputs.has(input)) inputs.set(input, input.disabled);
        if (!input.disabled) input.disabled = true;
        for (const label of Array.from(input.labels ?? [])) {
          if (!labels.has(label)) labels.set(label, { aria: label.getAttribute("aria-disabled"), marker: label.getAttribute("data-workspace-tour-upload-locked") });
          label.setAttribute("aria-disabled", "true");
          label.setAttribute("data-workspace-tour-upload-locked", "");
        }
      }

    }
    function block(event: Event) { event.preventDefault(); event.stopImmediatePropagation(); }
    function isFileControl(target: Element) {
      if (target.closest('input[type="file"], [data-workspace-tour-upload-locked]')) return true;
      const label = target.closest("label");
      return label?.control instanceof HTMLInputElement && label.control.type === "file";
    }
    function click(event: MouseEvent) {
      if (!(event.target instanceof Element) || !isFileControl(event.target)) return;
      event.preventDefault();
      // Other document guards may still dismiss the tour; the page itself cannot receive the click.
      event.stopPropagation();
    }
    function upload(event: DragEvent) {
      const fileDrop = Array.from(event.dataTransfer?.types ?? []).includes("Files") || Boolean(event.dataTransfer?.files.length);
      if (fileDrop || (event.target instanceof Element && event.target.closest('[data-workspace-tour="request-files"]'))) block(event);
    }
    function change(event: Event) {
      if (event.target instanceof HTMLInputElement && event.target.type === "file") block(event);
    }
    lockControls();
    const observer = new MutationObserver(lockControls);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
    document.addEventListener("click", click, true);
    document.addEventListener("auxclick", click, true);
    document.addEventListener("contextmenu", click, true);
    document.addEventListener("dragenter", upload, true);
    document.addEventListener("dragover", upload, true);
    document.addEventListener("drop", upload, true);
    document.addEventListener("change", change, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", click, true);
      document.removeEventListener("auxclick", click, true);
      document.removeEventListener("contextmenu", click, true);
      document.removeEventListener("dragenter", upload, true);
      document.removeEventListener("dragover", upload, true);
      document.removeEventListener("drop", upload, true);
      document.removeEventListener("change", change, true);
      for (const [input, disabled] of inputs) input.disabled = disabled;
      for (const [label, original] of labels) {
        restoreAttribute(label, "aria-disabled", original.aria);
        restoreAttribute(label, "data-workspace-tour-upload-locked", original.marker);
      }

    };
  }, [active]);
}


/** The Quotes stop explains navigation without opening that page. */
export function useWorkspaceTourInteractionGuards({ step, coach, pending, onSkip }: Props) {
  useLayoutEffect(() => {
    if (step !== 3) return;
    const links = new Map<HTMLAnchorElement, { aria: string | null; tab: string | null }>();
    function lockQuotes() {
      for (const link of document.querySelectorAll<HTMLAnchorElement>(quotesSelector)) {
        if (!links.has(link)) links.set(link, { aria: link.getAttribute("aria-disabled"), tab: link.getAttribute("tabindex") });
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("tabindex", "-1");
      }
    }
    function click(event: MouseEvent) {
      if (!(event.target instanceof Element) || coach.current?.contains(event.target)) return;
      if (event.target.closest(quotesSelector)) {
        event.preventDefault(); event.stopImmediatePropagation();
      } else if (event.type === "click" && event.button === 0) {
        // Dismiss without also activating an underlying navigation or workflow control.
        event.preventDefault(); event.stopImmediatePropagation();
        if (!pending) onSkip();
      }
    }
    lockQuotes();
    const observer = new MutationObserver(lockQuotes);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", click, true);
    document.addEventListener("auxclick", click, true);
    document.addEventListener("contextmenu", click, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", click, true);
      document.removeEventListener("auxclick", click, true);
      document.removeEventListener("contextmenu", click, true);
      for (const [link, original] of links) {
        if (original.aria === null) link.removeAttribute("aria-disabled"); else link.setAttribute("aria-disabled", original.aria);
        if (original.tab === null) link.removeAttribute("tabindex"); else link.setAttribute("tabindex", original.tab);
      }
    };
  }, [step, coach, pending, onSkip]);
}
