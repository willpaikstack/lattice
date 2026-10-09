"use client";
import { createContext, useContext, useEffect, useState } from "react";
export const CustomerWorkspaceScope = createContext<string | null>(null);
export function useCustomerWorkspaceScope() { return useContext(CustomerWorkspaceScope); }
export function customerDraftStorageKey(scope: string | null) { return scope ? `lattice.incompleteRfqs.v2.${encodeURIComponent(scope)}` : null; }
export function CustomerWorkspaceProvider({ scope, children }: { scope: string | null; children: React.ReactNode }) {
  const [ready, setReady] = useState(!scope); const [failed, setFailed] = useState(false);
  useEffect(() => {
    const key = customerDraftStorageKey(scope); if (!key) return;
    let disposed = false; let timer: ReturnType<typeof setTimeout>;
    const read = () => { try { const value = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };
    fetch("/api/request-drafts", { signal: AbortSignal.timeout(10000) }).then(async (response) => {
      if (!response.ok) throw new Error("Drafts unavailable");
      const { drafts, deletedIds = [] } = await response.json(); if (disposed) return;
      const merged = new Map<string, { id: string; updatedAt: string }>();
      for (const draft of [...read(), ...drafts]) if (draft?.id && !deletedIds.includes(draft.id) && (!merged.has(draft.id) || (merged.get(draft.id)?.updatedAt ?? "") < draft.updatedAt)) merged.set(draft.id, draft);
      localStorage.setItem(key, JSON.stringify([...merged.values()]));
    }).catch(() => { if (!disposed) setFailed(true); }).finally(() => { if (!disposed) setReady(true); });
    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { fetch("/api/request-drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(read()) }).then((response) => { if (!disposed) setFailed(!response.ok); }).catch(() => { if (!disposed) setFailed(true); }); }, 500);
    };
    const remove = (event: Event) => { const id = (event as CustomEvent<string>).detail; fetch(`/api/request-drafts?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then((response) => { if (!disposed && !response.ok) setFailed(true); }).catch(() => { if (!disposed) setFailed(true); }); };
    window.addEventListener("lattice-drafts-changed", sync); window.addEventListener("lattice-draft-removed", remove);
    return () => { disposed = true; clearTimeout(timer); window.removeEventListener("lattice-drafts-changed", sync); window.removeEventListener("lattice-draft-removed", remove); };
  }, [scope]);
  return <CustomerWorkspaceScope.Provider value={scope}>{failed && <p role="status" className="bg-amber-50 px-5 py-2 text-sm text-amber-900">Shared drafts are temporarily unavailable. Your draft changes are saved on this browser.</p>}{ready ? children : <p role="status" className="p-6 text-sm">Loading your workspace…</p>}</CustomerWorkspaceScope.Provider>;
}
