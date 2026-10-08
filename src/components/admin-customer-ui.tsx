"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { X } from "lucide-react";
import styles from "./admin-customers.module.css";

export function CustomerDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      className={styles.dialog}
      onCancel={onClose}
      ref={ref}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.dialogHeader}>
        <h2 id={titleId}>{title}</h2>
        <button
          aria-label={`Close ${title.toLowerCase()}`}
          className={styles.iconButton}
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>
      </div>
      <div className={styles.dialogBody}>{children}</div>
    </dialog>
  );
}

export function CustomerSubmit({
  children,
  busyText = "Saving…",
  danger = false,
}: {
  children: ReactNode;
  busyText?: string;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={danger ? styles.dangerButton : styles.primaryButton}
      disabled={pending}
      type="submit"
    >
      {pending ? busyText : children}
    </button>
  );
}

export function CustomerTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  id,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  id: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div aria-label={label} className={styles.tabs} role="tablist">
      {tabs.map((tab, index) => (
        <button
          aria-controls={`${id}-panel-${tab.value}`}
          aria-selected={value === tab.value}
          id={`${id}-tab-${tab.value}`}
          key={tab.value}
          onClick={() => onChange(tab.value)}
          onKeyDown={(event) => {
            const direction =
              event.key === "ArrowRight"
                ? 1
                : event.key === "ArrowLeft"
                  ? -1
                  : 0;
            if (!direction && event.key !== "Home" && event.key !== "End")
              return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : (index + direction + tabs.length) % tabs.length;
            onChange(tabs[next].value);
            refs.current[next]?.focus();
          }}
          ref={(node) => {
            refs.current[index] = node;
          }}
          role="tab"
          tabIndex={value === tab.value ? 0 : -1}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
