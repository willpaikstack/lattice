import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import { PublicHeader, TechnicalBackground } from "@/components/public-entry";

export const metadata: Metadata = {
  title: "Sign in | Lattice",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      <PublicHeader />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-20 pt-40 lg:px-8">
        <div className="relative z-10 w-full max-w-md">
          <SignIn forceRedirectUrl="/account/continue" path="/login" routing="path" signUpUrl="/sign-up" />
        </div>
        <TechnicalBackground />
      </section>
    </main>
  );
}
