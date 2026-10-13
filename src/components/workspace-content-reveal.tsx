"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { pageTransition } from "@/lib/page-transition";

export function WorkspaceContentReveal({ children, className = "space-y-5" }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={className}
      initial={reducedMotion ? false : { opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : pageTransition}
    >
      {children}
    </motion.div>
  );
}
