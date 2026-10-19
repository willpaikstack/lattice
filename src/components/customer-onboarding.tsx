"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { completeCustomerOnboarding } from "@/app/(workspace)/onboarding/actions";
import { WORKSPACE_TOUR_COMPLETION_SCREEN, workspaceTourSteps } from "@/lib/workspace-tour";
import { AccountSettingsWorkspace } from "./account-settings-workspace";
import type { AccountSettingsSnapshot } from "@/lib/account-settings-shared";
import { saveAccountSettingsAction, deferInitialAddressOnboardingAction } from "@/app/(workspace)/account/settings/actions";
import { useWorkspaceTourUploadLock } from "./workspace-tour-interaction-guards";
import { CustomerTourHelp, WorkspaceTour } from "./workspace-tour";

export type CustomerOnboardingState = { step: number; completed: boolean; name: string; company: string; needsAddressSetup?: boolean; addressSettings?: AccountSettingsSnapshot };

export function CustomerOnboarding({ initial, preview = false }: { initial: CustomerOnboardingState; preview?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(!initial.completed);
  const [addressHandled, setAddressHandled] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(initial.completed);
  const [replaying, setReplaying] = useState(false);
  const needsAddressSetup = !preview && !tourCompleted && !replaying && Boolean(initial.needsAddressSetup && initial.addressSettings) && !addressHandled;
  const [addressOpen, setAddressOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const previewLaunched = useRef(false);
  const eligibleRoute = !pathname.startsWith("/account/") && !pathname.startsWith("/admin/");
  const latest = useRef({ open, step, pending });
  useWorkspaceTourUploadLock(open && eligibleRoute);

  useEffect(() => { latest.current = { open, step, pending }; });
  useEffect(() => {
    function showHelp() {
      if (latest.current.pending) return;
      setError("");
      setHelp(true);
    }
    window.addEventListener("lattice-customer-help", showHelp);
    return () => window.removeEventListener("lattice-customer-help", showHelp);
  }, [preview]);

  useEffect(() => {
    // Preview is enabled only by the server-derived Lattice Admin role in AppShell.
    if (!preview || previewLaunched.current || pathname !== "/dashboard" || new URLSearchParams(window.location.search).get("tour") !== "preview") return;
    previewLaunched.current = true;
    const frame = requestAnimationFrame(() => { setStep(0); setOpen(true); setHelp(false); router.replace("/dashboard", { scroll: false }); });
    return () => cancelAnimationFrame(frame);
  }, [pathname, preview, router]);

  function goToStep(next: number, navigate = true) {
    if (pending) return;
    setError("");
    setStep(next);
    setOpen(true);
    setHelp(false);
    if (navigate && pathname !== workspaceTourSteps[next].path) router.push(workspaceTourSteps[next].path);
  }

  function dismissWithoutSaving() { setOpen(false); setHelp(false); setError(""); }
  function replay() { setReplaying(true); goToStep(0); }
  function finish(addressChoice: "now" | "later" = "later") {
    if (pending) return;
    startTransition(async () => {
      setError("");
      try {
        if (needsAddressSetup && addressChoice === "later") await deferInitialAddressOnboardingAction();
        if (!preview && !tourCompleted) await completeCustomerOnboarding();
        setTourCompleted(true);
        setOpen(false);
        setHelp(false);
        if (needsAddressSetup && addressChoice === "now") setAddressOpen(true);
        else if (needsAddressSetup) setAddressHandled(true);
      } catch {
        setError("Your tour completion could not be saved. Try again, or close without saving.");
      }
    });
  }
  function next() {
    if (pathname !== workspaceTourSteps[step].path) { goToStep(step); return; }
    if (step === WORKSPACE_TOUR_COMPLETION_SCREEN) { finish(); return; }
    goToStep(step + 1);
  }

  if (addressOpen && !preview && initial.addressSettings && eligibleRoute) return <AccountSettingsWorkspace onboardingOnly initialSettings={initial.addressSettings} saveSettingsAction={saveAccountSettingsAction} deferInitialAddressOnboardingAction={deferInitialAddressOnboardingAction} onOnboardingComplete={() => { setAddressOpen(false); setAddressHandled(true); router.refresh(); }} />;

  const completingTour = open && step === WORKSPACE_TOUR_COMPLETION_SCREEN;
  if (completingTour) {
    if (pathname !== workspaceTourSteps[step].path) return null;
    return <CustomerTourHelp pending={pending} error={error} onReplay={replay} onClose={() => finish("later")} onDismissError={dismissWithoutSaving} onFinish={() => finish("later")} onAddAddresses={() => finish("now")} needsAddressSetup={needsAddressSetup} />;
  }
  if (help) return <CustomerTourHelp pending={pending} error={error} onReplay={replay} onClose={() => { setHelp(false); setError(""); }} onDismissError={dismissWithoutSaving} needsAddressSetup={needsAddressSetup} />;
  if (!eligibleRoute) return null;
  if (!open) return null;
  return <WorkspaceTour step={step} name={initial.name} pathname={pathname} preview={preview} pending={pending} error={error} onStep={goToStep} onSkip={() => finish("later")} onNext={next} onDismissError={dismissWithoutSaving} />;
}
