"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { KeyboardEvent, useActionState, useEffect, useMemo, useRef, useState } from "react";

import { loginAction, type LoginActionState } from "@/app/login/actions";

type LoginPanelProps = {
  initialEmail: string;
  initialErrorMessage: string;
  next: string;
  ssoEnabled: boolean;
};

const fieldClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/15 disabled:cursor-not-allowed disabled:bg-stone-100";

export function LoginPanel({ initialEmail, initialErrorMessage, next, ssoEnabled }: LoginPanelProps) {
  const initialState: LoginActionState = {
    email: initialEmail,
    message: "",
    next,
    status: "idle",
  };
  const [state, passwordAction, pending] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState(initialEmail);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [initialErrorVisible, setInitialErrorVisible] = useState(Boolean(initialErrorMessage));
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const actionError = state.status === "error" && state.email === email ? state.message : "";
  const errorMessage = actionError || (initialErrorVisible ? initialErrorMessage : "");
  const googleHref = useMemo(() => {
    const params = new URLSearchParams({ email, next });
    return `/api/auth/google?${params.toString()}`;
  }, [email, next]);

  useEffect(() => {
    if (state.status === "error") {
      passwordInputRef.current?.focus();
    }
  }, [state.status]);

  function updateCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-7 shadow-xl sm:p-9">
      <div className="space-y-6">
        <div>
          <div aria-hidden="true" className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
            <LockKeyhole size={18} />
          </div>
          <h1 className="text-2xl font-semibold tracking-normal text-stone-900">Sign in to Lattice</h1>
          <p className="mt-1 text-sm leading-6 text-stone-600">Use your work account to access the private workspace.</p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" id="login-error" role="alert">
            <p className="font-medium">We couldn&apos;t sign you in.</p>
            <p className="mt-1 leading-5">{errorMessage}</p>
          </div>
        ) : null}

        {ssoEnabled ? (
          <>
            <Link className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#747775] bg-white px-4 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2" href={googleHref}>
              <Image alt="" aria-hidden="true" height={18} src="/google-g.svg" width={18} />
              Continue with Google Workspace
            </Link>
            <div className="flex items-center gap-3" aria-hidden="true">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">or</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>
          </>
        ) : null}

        <form action={passwordAction} aria-label="Sign in form" className="space-y-5">
          <input name="next" type="hidden" value={next} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700" htmlFor="login-email">
              Work email
            </label>
            <input
              autoComplete="email"
              autoFocus
              className={fieldClassName}
              disabled={pending}
              id="login-email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value.trimStart());
                setInitialErrorVisible(false);
              }}
              placeholder="you@company.com"
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <input
                aria-describedby={errorMessage ? "login-error" : capsLockOn ? "caps-lock-message" : undefined}
                aria-invalid={Boolean(actionError)}
                autoComplete="current-password"
                className={`${fieldClassName} pr-12`}
                disabled={pending}
                id="login-password"
                name="password"
                onKeyDown={updateCapsLock}
                onKeyUp={updateCapsLock}
                placeholder="Enter your password"
                ref={passwordInputRef}
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded text-stone-500 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                onClick={() => setShowPassword((visible) => !visible)}
                title={showPassword ? "Hide password" : "Show password"}
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
              </button>
            </div>
            {capsLockOn ? <p className="text-sm text-amber-800" id="caps-lock-message">Caps Lock is on.</p> : null}
          </div>

          <button className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 font-medium text-white transition-colors hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-wait disabled:bg-stone-600" disabled={pending} type="submit">
            {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : null}
            {pending ? "Signing in..." : "Sign in"}
            {!pending ? <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" size={16} /> : null}
          </button>

          <Link className="inline-flex min-h-6 items-center text-sm font-medium text-stone-700 underline-offset-4 hover:text-stone-950 hover:underline focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2" href={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}>
            Forgot password?
          </Link>
        </form>

        <div className="border-t border-stone-200 pt-5 text-center text-sm text-stone-600">
          <p>
            Need access?{" "}
            <Link className="inline-flex min-h-6 items-center font-medium text-stone-900 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2" href="/waiting-list">
              Request an invite
            </Link>
          </p>
          <p className="mt-2">
            Trouble signing in?{" "}
            <a className="inline-flex min-h-6 items-center font-medium text-stone-900 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2" href="mailto:support@latticeos.co">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
