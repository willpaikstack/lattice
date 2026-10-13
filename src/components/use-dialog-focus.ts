"use client";

import { useEffect, useRef } from "react";

/** Keep a mounted dialog keyboard-contained and restore its opening control. */
export function useDialogFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const background: Array<{ element: HTMLElement; inert: boolean }> = [];
    let branch: HTMLElement = dialog;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          background.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]',
    )).filter(element => element.tabIndex >= 0 && !element.matches(':disabled') &&
      !element.closest('[hidden], [inert]') && getComputedStyle(element).display !== 'none');
    const focusFirst = () => (focusable()[0] ?? dialog).focus();
    const containFocus = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) focusFirst();
    };
    const containTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = focusable();
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('focusin', containFocus);
    document.addEventListener('keydown', containTab);
    focusFirst();
    return () => {
      document.removeEventListener('focusin', containFocus);
      document.removeEventListener('keydown', containTab);
      for (const entry of background) entry.element.inert = entry.inert;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return ref;
}
