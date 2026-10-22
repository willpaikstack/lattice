import type { Metadata } from "next";
import { LatticeSignIn } from "@/components/lattice-sign-in";

import { PublicAuthLayout } from "@/components/public-marketing";

export const metadata: Metadata = {
  title: "Sign in | Lattice",
};

export default function LoginPage() {
  return (
    <PublicAuthLayout>
      <LatticeSignIn />
    </PublicAuthLayout>
  );
}
