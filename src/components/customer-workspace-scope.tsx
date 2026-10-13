"use client";
import { purgeBrowserLegacyRfqValues, purgeLegacyRfqValues } from "@/lib/purge-legacy-rfq-values";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WorkspaceListLoading } from "@/components/workspace-list-loading";
import { RequestFormLoading } from "@/components/request-form-loading";
import { isPreviewDraftId, sharedDraftsFromBrowser } from "@/lib/shared-draft-policy";
export const CustomerWorkspaceScope = createContext<string | null>(null);
export function useCustomerWorkspaceScope() { return useContext(CustomerWorkspaceScope); }
export function customerDraftStorageKey(scope: string | null) { return scope ? `lattice.incompleteRfqs.v2.${encodeURIComponent(scope)}` : null; }
export function CustomerWorkspaceProvider({ scope, children }: { scope: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const needsSharedDrafts = pathname === "/quotes" || pathname === "/requests/new";
  const [ready, setReady] = useState(!scope); const [failed, setFailed] = useState(false);
  const [restoreCount, setRestoreCount] = useState(0);
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      // Back/forward cache can restore a document while its original fetch was
      // suspended. Restart synchronization rather than keeping a stale loader.
      if (event.persisted) setRestoreCount((count) => count + 1);
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const cleanup = purgeBrowserLegacyRfqValues();
      console.info("Legacy RFQ draft cleanup", JSON.stringify(cleanup));
    }
  }, []);
  useEffect(() => {
    const key = customerDraftStorageKey(scope); if (!key) return;
    let disposed = false; let timer: ReturnType<typeof setTimeout>;
    const read = () => { try { const value = purgeLegacyRfqValues(JSON.parse(localStorage.getItem(key) ?? "[]")); return Array.isArray(value) ? value : []; } catch { return []; } };
    fetch("/api/request-drafts", { signal: AbortSignal.timeout(10000) }).then(async (response) => {
      if (!response.ok) throw new Error("Drafts unavailable");
      const { drafts, deletedIds = [] } = await response.json(); if (disposed) return;
      const merged = new Map<string, { id: string; updatedAt: string }>();
      for (const draft of [...read(), ...drafts]) if (draft?.id && !deletedIds.includes(draft.id) && (!merged.has(draft.id) || (merged.get(draft.id)?.updatedAt ?? "") < draft.updatedAt)) merged.set(draft.id, draft);
      localStorage.setItem(key, JSON.stringify(purgeLegacyRfqValues([...merged.values()])));
      if (!disposed) setFailed(false);
    }).catch(() => { if (!disposed) setFailed(true); }).finally(() => { if (!disposed) setReady(true); });
    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { fetch("/api/request-drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sharedDraftsFromBrowser(read())) }).then((response) => { if (!disposed) setFailed(!response.ok); }).catch(() => { if (!disposed) setFailed(true); }); }, 500);
    };
    const remove = (event: Event) => { const id = (event as CustomEvent<string>).detail; if (isPreviewDraftId(id)) return; fetch(`/api/request-drafts?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then((response) => { if (!disposed && !response.ok) setFailed(true); }).catch(() => { if (!disposed) setFailed(true); }); };
    window.addEventListener("lattice-drafts-changed", sync); window.addEventListener("lattice-draft-removed", remove);
    return () => { disposed = true; clearTimeout(timer); window.removeEventListener("lattice-drafts-changed", sync); window.removeEventListener("lattice-draft-removed", remove); };
  }, [scope, restoreCount]);
  return <CustomerWorkspaceScope.Provider value={scope}>{failed && <p role="status" className="bg-amber-50 px-5 py-2 text-sm text-amber-900">Shared drafts are temporarily unavailable. Your draft changes are saved on this browser.</p>}{ready || !needsSharedDrafts ? children : pathname === "/quotes" ? <WorkspaceListLoading kind="quotes" /> : <RequestFormLoading />}</CustomerWorkspaceScope.Provider>;
}
