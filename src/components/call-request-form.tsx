"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { requestCallAction } from "@/app/book-a-call/actions";
import type { CallRequestState } from "@/lib/call-request";
import s from "./public-marketing.module.css";

export function CallRequestForm() {
  const [state, action, pending] = useActionState<CallRequestState, FormData>(
    requestCallAction,
    { status: "idle", message: "" },
  );
  const [values, setValues] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    needs: "",
    availability: "",
  });
  if (state.status === "received")
    return (
      <div className={s.formPanel} role="status" aria-live="polite">
        <CheckCircle2
          aria-hidden="true"
          className="mb-6 text-lime-800"
          size={36}
        />
        <h2>Call request received.</h2>
        <p>{state.message}</p>
        <p>
          We’ll discuss your shop, the work you want to take on, and whether
          Lattice is a good fit. No files are needed for this first
          conversation.
        </p>
        <Link className={s.textLink} href="/">
          Return to Lattice <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      </div>
    );
  return (
    <div className={s.formPanel}>
      <h2>Tell us about your shop.</h2>
      <p>Leave a few details. We’ll follow up by email to find a time.</p>
      <form action={action} aria-label="Call request form" className={s.form}>
        <div className={s.fieldRow}>
          <label className={s.field} htmlFor="call-name">
            Full name
            <input
              autoComplete="name"
              id="call-name"
              maxLength={120}
              name="name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Alex Morgan"
              required
            />
          </label>
          <label className={s.field} htmlFor="call-company">
            Company
            <input
              autoComplete="organization"
              id="call-company"
              maxLength={180}
              name="company"
              value={values.company}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  company: event.target.value,
                }))
              }
              placeholder="Your shop name"
              required
            />
          </label>
        </div>
        <label className={s.field} htmlFor="call-email">
          Work email
          <input
            autoComplete="email"
            id="call-email"
            maxLength={254}
            name="email"
            value={values.email}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="you@yourshop.com"
            required
            type="email"
          />
        </label>
        <label className={s.field} htmlFor="call-phone">
          Phone (optional)
          <input
            autoComplete="tel"
            id="call-phone"
            maxLength={50}
            name="phone"
            value={values.phone}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            placeholder="(555) 555-0100"
            type="tel"
          />
        </label>
        <label className={s.field} htmlFor="call-needs">
          Where could you use support?
          <textarea
            id="call-needs"
            maxLength={3000}
            name="needs"
            value={values.needs}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                needs: event.target.value,
              }))
            }
            placeholder="Overflow milling, repeat turned parts, a process you don’t have in-house…"
            required
            rows={4}
          />
        </label>
        <label className={s.field} htmlFor="call-availability">
          Preferred times and time zone (optional)
          <input
            id="call-availability"
            maxLength={300}
            name="availability"
            value={values.availability}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                availability: event.target.value,
              }))
            }
            placeholder="For example, weekday mornings, Eastern time"
          />
        </label>
        <div aria-hidden="true" className={s.honeypot}>
          <label htmlFor="call-website">
            Leave this field empty
            <input
              autoComplete="off"
              id="call-website"
              name="website"
              tabIndex={-1}
            />
          </label>
        </div>
        {state.status === "error" ? (
          <p className={`${s.notice} ${s.error}`} role="alert">
            {state.message}
          </p>
        ) : null}
        <button className={s.button} disabled={pending} type="submit">
          {pending ? "Sending your request…" : "Request a call"}
          <ArrowUpRight aria-hidden="true" size={17} />
        </button>
        <p className={s.formFinePrint}>
          By submitting, you’re asking Lattice to contact you about your
          manufacturing needs. We’ll confirm a time by email. Please keep
          confidential or export-controlled information out of this form.
        </p>
      </form>
    </div>
  );
}
