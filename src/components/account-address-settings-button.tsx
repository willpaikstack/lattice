"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./account-address-focus.module.css";

export function AccountAddressSettingsButton({ children, onClick, target }: { children: React.ReactNode; onClick: () => void; target: "shipping" | "billing-address" | "billing-contact" }) {
  const search = useSearchParams();
  const button = useRef<HTMLButtonElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const highlighted = search.get("focus") === target && !dismissed;
  const controlId = target === "shipping" ? "shipping-address" : target;

  useEffect(() => {
    if (!highlighted) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    button.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    button.current?.focus({ preventScroll: true });
  }, [highlighted]);

  function editAddress() {
    setDismissed(true);
    const url = new URL(window.location.href);
    if (url.searchParams.get("focus") === target) {
      url.searchParams.delete("focus");
      if (url.hash === `#${controlId}`) url.hash = "";
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
    onClick();
  }

  return <button
    className={`w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]${highlighted ? ` ${styles.halo}` : ""}`}
    data-address-highlight={highlighted ? "true" : undefined}
    id={controlId}
    onClick={editAddress}
    ref={button}
    type="button"
  >{children}</button>;
}
