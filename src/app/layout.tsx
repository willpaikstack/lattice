import { ClerkProvider } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { clerkUserDisplayName } from "@/lib/clerk-user-profile";
import { getCurrentSession } from "@/lib/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lattice OS",
  description: "Owned-code manufacturing RFQ and procurement workflow platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-lattice-pathname") ?? "";

  // Clerk owns every nested login/sign-up challenge (for example, client
  // trust). Do not resolve Lattice workspace state or render its shell until
  // Clerk has completed that flow.
  if (pathname === "/login" || pathname.startsWith("/login/") || pathname === "/sign-up" || pathname.startsWith("/sign-up/") || pathname === "/account/set-password") {
    return (
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <ClerkProvider>{children}</ClerkProvider>
          <Analytics />
        </body>
      </html>
    );
  }

  const session = await getCurrentSession({ allowPasswordChange: true });
  const clerkUser = session ? null : await currentUser();
  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress?.trim() ?? "";
  const shellUser = session?.user
    ? { email: session.user.email, name: session.user.name }
    : clerkUser
      ? { email: clerkEmail, name: clerkUserDisplayName(clerkUser) || "Account" }
      : undefined;

  if (session?.user.mustChangePassword && pathname !== "/account/set-password") {
    redirect("/account/set-password");
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <AppShell sessionRole={session?.user.role} sessionUser={shellUser} supportAdmin={session?.user.supportAdmin ?? undefined}>{children}</AppShell>
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  );
}
