"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

const PlasticFunctionalProfileGroupContext = createContext<(details: HTMLDetailsElement) => void>(() => {});

export function PlasticFunctionalProfileGroup({ children }: { children: ReactNode }) {
  const openDetailsRef = useRef<HTMLDetailsElement | null>(null);

  const setOpenDetails = useCallback((details: HTMLDetailsElement) => {
    if (openDetailsRef.current && openDetailsRef.current !== details) {
      openDetailsRef.current.open = false;
    }
    openDetailsRef.current = details;
  }, []);

  return (
    <PlasticFunctionalProfileGroupContext.Provider value={setOpenDetails}>
      {children}
    </PlasticFunctionalProfileGroupContext.Provider>
  );
}

export function usePlasticFunctionalProfileGroup() {
  return useContext(PlasticFunctionalProfileGroupContext);
}
