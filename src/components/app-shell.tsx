"use client";

import { ArrowLeft, ClipboardList, Factory, FileSearch, Inbox, Layers, LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser, initialsForName } from "@/lib/current-user";

type IconName = "home" | "analytics" | "project" | "money" | "admin" | "factory" | "queue" | "back" | "user" | "logout";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type PageTransitionPhase = "idle" | "exit" | "enter";

type NavigationHandler = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void;

const pageTransition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
};

const customerNavSections: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "Home", icon: "home" },
      { href: "/quotes", label: "Quotes", icon: "money" },
      { href: "/orders", label: "Orders", icon: "project" },
    ],
  },
  {
    title: "Your Resources",
    items: [
      { href: "/materials", label: "Materials", icon: "analytics" },
      { href: "/capabilities", label: "Capabilities", icon: "queue" },
      { href: "/equipment", label: "Equipment", icon: "factory" },
    ],
  },
];

const adminNavSections: NavSection[] = [
  {
    title: "Admin",
    items: [
      { href: "/admin", label: "Overview", icon: "admin" },
      { href: "/admin/customers", label: "Customers", icon: "user" },
      { href: "/admin/vendors", label: "Overseas Vendors", icon: "factory" },
      { href: "/admin/quotes", label: "Quote Submissions", icon: "money" },
      { href: "/admin/orders", label: "Placed Orders", icon: "factory" },
    ],
  },
];

const adminRoutePrefixes = ["/admin", "/analytics", "/projects", "/operator"];
const publicRoutes = new Set(["/", "/login", "/forgot-password", "/waiting-list"]);
const iconByName: Record<IconName, LucideIcon> = {
  admin: Settings,
  analytics: Layers,
  back: ArrowLeft,
  factory: Factory,
  home: LayoutDashboard,
  logout: LogOut,
  money: Inbox,
  project: ClipboardList,
  queue: FileSearch,
  user: User,
};

function isAdminRoute(pathname: string) {
  return adminRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isNavItemActive(pathname: string, href: string) {
  if (href === "/" || href === "/admin" || href === "/admin/quotes") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarIcon({ name }: { name: IconName }) {
  const Icon = iconByName[name];

  return <Icon aria-hidden="true" size={16} strokeWidth={2} />;
}

function LatticeMark({ onNavigate, tone = "customer" }: { onNavigate?: NavigationHandler; tone?: "customer" | "admin" }) {
  const isAdmin = tone === "admin";

  return (
    <Link
      aria-label="Lattice home"
      className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${isAdmin ? "bg-[#4f3424]" : "bg-[#171717]"}`}
      href="/dashboard"
      onClick={(event) => onNavigate?.(event, "/dashboard")}
    >
      <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 28 28">
        <path d="M14 2.8 23.8 8.4v11.2L14 25.2 4.2 19.6V8.4L14 2.8Z" fill={isAdmin ? "#FFD3AC" : "#f6f7f8"} opacity="0.92" />
        <path d="M14 2.8v11.3l9.8 5.5M14 14.1 4.2 19.6M14 14.1l9.8-5.7M14 14.1 4.2 8.4" fill="none" stroke={isAdmin ? "#a26943" : "#62666d"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    </Link>
  );
}

function DesktopNavSection({ onNavigate, section, pathname, tone }: { onNavigate: NavigationHandler; section: NavSection; pathname: string; tone: "customer" | "admin" }) {
  return (
    <section className="space-y-2">
      <p className={`px-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone === "admin" ? "text-[#7a4d2d]" : "text-[#8c8f94]"}`}>{section.title}</p>
      <div className="space-y-1.5">
        {section.items.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const activeClass =
            tone === "admin"
              ? "bg-[#FFD3AC] font-semibold text-[#3a281d] shadow-[inset_3px_0_0_#a26943]"
              : "border border-stone-200/60 bg-white font-medium text-stone-900 shadow-sm";
          const inactiveClass = tone === "admin" ? "font-medium text-[#80614d]" : "border border-transparent font-medium text-stone-600";
          const hoverClass =
            isActive
              ? ""
              : tone === "admin"
                ? "hover:bg-[#fff1e4] hover:text-[#4f3424]"
                : "hover:bg-stone-200/50 hover:text-stone-900";

          return (
            <Link
              className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[14px] transition duration-150 active:scale-[0.99] ${hoverClass} ${isActive ? activeClass : inactiveClass}`}
              href={item.href}
              key={`${section.title}-${item.label}`}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => onNavigate(event, item.href)}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isActive && tone !== "admin" ? "text-stone-900" : "text-stone-400 group-hover:text-current"}`}>
                <SidebarIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function UtilityLink({ href, icon, label, detail, onNavigate, tone = "customer" }: NavItem & { detail: string; onNavigate: NavigationHandler; tone?: "customer" | "admin" }) {
  return (
    <Link
      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
        tone === "admin" ? "border-[#efb987] bg-[#fff6ee] hover:bg-[#ffe8d3]" : "border-[#e4e1dc] bg-[#fbfaf8] hover:bg-white"
      }`}
      href={href}
      onClick={(event) => onNavigate(event, href)}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone === "admin" ? "bg-[#FFD3AC] text-[#3a281d]" : "bg-white text-[#6b7280] shadow-sm"}`}>
        <SidebarIcon name={icon} />
      </span>
      <span className="min-w-0">
        <span className={`block text-[14px] font-semibold ${tone === "admin" ? "text-[#3a281d]" : "text-[#222222]"}`}>{label}</span>
        <span className={`mt-0.5 block text-[12px] leading-4 ${tone === "admin" ? "text-[#80614d]" : "text-[#7a7f87]"}`}>{detail}</span>
      </span>
    </Link>
  );
}

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const initials = initialsForName(currentUser.name);

  function handleSignOut() {
    setIsOpen(false);
    window.location.href = "/api/logout";
  }

  return (
    <div className="relative border-t border-[#ebe7df] pt-3">
      {isOpen ? (
        <div className="absolute bottom-[76px] left-0 right-0 rounded-2xl border border-[#e4e1dc] bg-white py-2 shadow-lg shadow-black/5">
          <Link className="flex min-h-11 items-center gap-3 px-3 text-[14px] font-medium text-[#73737c] transition hover:bg-[#f7f7f7] hover:text-[#222222]" href="/account/settings">
            <SidebarIcon name="user" />
            <span>Account Settings</span>
          </Link>
          <button
            className="flex min-h-11 w-full items-center gap-3 px-3 text-left text-[14px] font-medium text-[#73737c] transition hover:bg-[#f7f7f7] hover:text-[#222222]"
            onClick={handleSignOut}
            type="button"
          >
            <SidebarIcon name="logout" />
            <span>Sign Out</span>
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3 rounded-2xl bg-[#f7f6f3] p-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[12px] font-semibold text-[#ffffff]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-5 text-[#303036]">{currentUser.name}</p>
          <p className="truncate text-[12px] font-medium leading-4 text-[#85858c]">{currentUser.email}</p>
        </div>
        <button
          aria-expanded={isOpen}
          aria-label="Account menu"
          className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-[#303036] transition hover:bg-[#f3f4f6]"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" className="text-[22px] leading-none">
            ⋮
          </span>
        </button>
      </div>
    </div>
  );
}

function PageTransition({
  children,
  onAnimationComplete,
  pathname,
  phase,
}: {
  children: React.ReactNode;
  onAnimationComplete: () => void;
  pathname: string;
  phase: PageTransitionPhase;
}) {
  return (
    <motion.div
      animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      className="min-h-full w-full px-5 py-6 lg:px-10 lg:py-8"
      initial={phase === "enter" ? { opacity: 0 } : false}
      key={pathname}
      onAnimationComplete={onAnimationComplete}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pageTransitionPhase, setPageTransitionPhase] = useState<PageTransitionPhase>("idle");
  const isPublicRoute = publicRoutes.has(pathname);
  const inAdminExperience = isAdminRoute(pathname);
  const activeNavPathname = pendingHref ?? pathname;
  const isRequestQuoteRoute = activeNavPathname === "/requests/new" || activeNavPathname.startsWith("/requests/new/");
  const navSections = inAdminExperience ? adminNavSections : customerNavSections;

  useEffect(() => {
    if (!pendingHref || pathname !== pendingHref) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setPendingHref(null);
      setPageTransitionPhase("enter");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, pendingHref]);

  function handleNavigate(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    if (pathname === href) {
      return;
    }

    if (pathname.startsWith(`${href}/`)) {
      router.push(href);
      return;
    }

    setPendingHref(href);
    setPageTransitionPhase("exit");
  }

  function handlePageAnimationComplete() {
    if (pageTransitionPhase === "exit" && pendingHref) {
      router.push(pendingHref);
      return;
    }

    if (pageTransitionPhase === "enter") {
      setPageTransitionPhase("idle");
    }
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen text-slate-950 ${inAdminExperience ? "bg-[#fff4ea]" : "bg-[#f8f7f4]"}`}>
      <div className="min-h-screen lg:pl-72">
        <aside
          className={`fixed inset-y-0 left-0 z-30 hidden w-72 shrink-0 overflow-y-auto border-r px-4 py-5 shadow-[4px_0_24px_rgba(0,0,0,0.03)] [scrollbar-width:none] lg:flex lg:flex-col [&::-webkit-scrollbar]:hidden ${
            inAdminExperience ? "border-[#efc29a] bg-[#fffaf6]" : "border-[#e8e3da] bg-[#fbfaf7]"
          }`}
        >
          <div>
            <div className="flex items-center gap-3">
              <LatticeMark onNavigate={handleNavigate} tone={inAdminExperience ? "admin" : "customer"} />
              <div>
                <p className="text-[16px] font-semibold leading-5 text-[#171717]">Lattice OS</p>
              </div>
            </div>

            {!inAdminExperience ? (
              <Link
                aria-current={isRequestQuoteRoute ? "page" : undefined}
                className={`mt-8 flex h-11 w-full items-center justify-center rounded-lg border px-4 text-[14px] transition duration-150 active:scale-[0.99] ${
                  isRequestQuoteRoute
                    ? "border-stone-200/60 bg-white font-medium text-stone-900 shadow-sm"
                    : "border-stone-200/70 bg-transparent font-semibold text-stone-700 shadow-none hover:border-stone-300 hover:bg-stone-200/50 hover:text-stone-900"
                }`}
                href="/requests/new"
                onClick={(event) => handleNavigate(event, "/requests/new")}
              >
                Request Quote
              </Link>
            ) : inAdminExperience ? (
              <div className="mt-12 rounded-md border border-[#efb987] bg-[#FFD3AC] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f4529]">Admin mode</p>
                <p className="mt-2 text-[14px] leading-5 text-[#3a281d]">A focused workspace for quote requests and supplier follow-up.</p>
              </div>
            ) : null}

            <nav className="mt-6 space-y-7">
              {navSections.map((section) => (
                <DesktopNavSection
                  key={section.title}
                  onNavigate={handleNavigate}
                  pathname={activeNavPathname}
                  section={section}
                  tone={inAdminExperience ? "admin" : "customer"}
                />
              ))}
            </nav>
          </div>

          <div className="mt-auto space-y-4 pt-4">
            {inAdminExperience ? (
              <UtilityLink detail="Return to the customer workspace." href="/dashboard" icon="back" label="Customer App" onNavigate={handleNavigate} tone="admin" />
            ) : (
              <UtilityLink detail="Open internal controls." href="/admin" icon="admin" label="Admin" onNavigate={handleNavigate} />
            )}
            <ProfileMenu />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-10 border-b px-5 py-4 backdrop-blur lg:hidden ${
              inAdminExperience ? "border-[#efc29a] bg-[#fff6ee]/95" : "border-slate-200 bg-white/90"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <LatticeMark onNavigate={handleNavigate} tone={inAdminExperience ? "admin" : "customer"} />
              <Link
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${inAdminExperience ? "bg-[#FFD3AC] text-[#3a281d]" : "bg-[#858585] text-[#ffffff]"}`}
                href={inAdminExperience ? "/dashboard" : "/admin"}
                onClick={(event) => handleNavigate(event, inAdminExperience ? "/dashboard" : "/admin")}
              >
                {inAdminExperience ? "Customer App" : "Admin"}
              </Link>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm font-medium text-slate-600">
              {navSections.flatMap((section) => section.items).map((item) => {
                const isActive = isNavItemActive(activeNavPathname, item.href);

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-full border px-3 py-1.5 ${
                      inAdminExperience
                        ? isActive
                          ? "border-[#a26943] bg-[#FFD3AC] font-semibold text-[#3a281d]"
                          : "border-[#efb987] bg-[#fffaf6] text-[#5c3d28]"
                        : isActive
                          ? "border-slate-950 bg-slate-950 font-semibold text-[#ffffff]"
                          : "border-slate-200 bg-white"
                    }`}
                    href={item.href}
                    key={`mobile-${item.label}`}
                    onClick={(event) => handleNavigate(event, item.href)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="relative w-full overflow-x-hidden">
            <PageTransition
              onAnimationComplete={handlePageAnimationComplete}
              pathname={pathname}
              phase={pageTransitionPhase}
            >
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
