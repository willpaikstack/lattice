"use client";

import { ArrowLeft, Bell, ClipboardList, Factory, FileSearch, FileText, GripVertical, Inbox, Layers, LayoutDashboard, LogOut, Map as MapIcon, Settings, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser, initialsForName } from "@/lib/current-user";
import type { LatticeRole } from "@/lib/auth-crypto";

type IconName = "home" | "analytics" | "project" | "money" | "admin" | "factory" | "queue" | "back" | "user" | "logout" | "resources" | "roadmap";

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
type ReorderHandler = (sectionTitle: string, draggedHref: string, targetHref: string) => void;

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
      { href: "/roadmap", label: "Roadmap", icon: "roadmap" },
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
      { href: "/admin/quotes", label: "Quote Submissions", icon: "money" },
      { href: "/admin/customers", label: "Customers", icon: "user" },
      { href: "/admin/vendors", label: "Overseas Vendors", icon: "factory" },
      { href: "/admin/orders", label: "Placed Orders", icon: "factory" },
      { href: "/admin/resources", label: "Resources", icon: "resources" },
    ],
  },
];

const adminRoutePrefixes = ["/admin", "/analytics", "/projects", "/operator"];
const publicRoutes = new Set(["/", "/login", "/forgot-password", "/waiting-list"]);
const navOrderStoragePrefix = "lattice:sidebar-nav-order";
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
  resources: FileText,
  roadmap: MapIcon,
  user: User,
};

function isAdminRoute(pathname: string) {
  return adminRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isNavItemActive(pathname: string, href: string) {
  if (href === "/" || href === "/admin/quotes") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function moveItem(items: string[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function applyStoredOrder(section: NavSection, orderedHrefs: string[] | undefined): NavSection {
  if (!orderedHrefs?.length) {
    return section;
  }

  const itemByHref = new Map(section.items.map((item) => [item.href, item]));
  const orderedItems = orderedHrefs
    .map((href) => itemByHref.get(href))
    .filter((item): item is NavItem => Boolean(item));
  const orderedHrefSet = new Set(orderedItems.map((item) => item.href));
  const remainingItems = section.items.filter((item) => !orderedHrefSet.has(item.href));

  return {
    ...section,
    items: [...orderedItems, ...remainingItems],
  };
}

function navOrderStorageKey(tone: "customer" | "admin") {
  return `${navOrderStoragePrefix}:${currentUser.email}:${tone}`;
}

function readStoredNavOrder(tone: "customer" | "admin") {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const savedOrder = window.localStorage.getItem(navOrderStorageKey(tone));
    return savedOrder ? JSON.parse(savedOrder) : {};
  } catch {
    return {};
  }
}

function SidebarIcon({ name }: { name: IconName }) {
  const Icon = iconByName[name];

  return <Icon aria-hidden="true" size={16} strokeWidth={2} />;
}

function LatticeMark({ onNavigate, tone = "customer" }: { onNavigate?: NavigationHandler; tone?: "customer" | "admin" }) {
  const isAdmin = tone === "admin";
  const homeHref = isAdmin ? "/admin/quotes" : "/dashboard";

  return (
    <Link
      aria-label={isAdmin ? "Lattice admin home" : "Lattice home"}
      className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${isAdmin ? "bg-[#FF5A5F]" : "bg-[#171717]"}`}
      href={homeHref}
      onClick={(event) => onNavigate?.(event, homeHref)}
    >
      <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 28 28">
        <path d="M14 2.8 23.8 8.4v11.2L14 25.2 4.2 19.6V8.4L14 2.8Z" fill={isAdmin ? "#fff1f2" : "#f6f7f8"} opacity="0.92" />
        <path d="M14 2.8v11.3l9.8 5.5M14 14.1 4.2 19.6M14 14.1l9.8-5.7M14 14.1 4.2 8.4" fill="none" stroke={isAdmin ? "#FF5A5F" : "#62666d"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    </Link>
  );
}

function NotificationLink({ onNavigate, pathname }: { onNavigate: NavigationHandler; pathname: string }) {
  const isActive = isNavItemActive(pathname, "/notifications");

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      aria-label="Notifications"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
        isActive
          ? "border-stone-300 bg-white text-stone-950 shadow-sm"
          : "border-transparent text-stone-500 hover:border-stone-200 hover:bg-white hover:text-stone-950"
      }`}
      href="/notifications"
      onClick={(event) => onNavigate(event, "/notifications")}
      title="Notifications"
    >
      <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
    </Link>
  );
}

function DesktopNavSection({
  onNavigate,
  onReorder,
  section,
  pathname,
  tone,
}: {
  onNavigate: NavigationHandler;
  onReorder: ReorderHandler;
  section: NavSection;
  pathname: string;
  tone: "customer" | "admin";
}) {
  return (
    <section className="space-y-2">
      <p className={`px-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone === "admin" ? "text-[#767676]" : "text-[#8c8f94]"}`}>{section.title}</p>
      <div className="space-y-1.5">
        {section.items.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const activeClass =
            tone === "admin"
              ? "bg-[#fff1f2] font-semibold text-[#484848] shadow-[inset_3px_0_0_#FF5A5F]"
              : "border border-stone-200/60 bg-white font-medium text-stone-900 shadow-sm";
          const inactiveClass = tone === "admin" ? "font-medium text-[#767676]" : "border border-transparent font-medium text-stone-600";
          const hoverClass =
            isActive
              ? ""
              : tone === "admin"
                ? "hover:bg-[#fff1f2] hover:text-[#FF5A5F]"
                : "hover:bg-stone-200/50 hover:text-stone-900";

          return (
            <Link
              className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[14px] transition duration-150 active:scale-[0.99] ${hoverClass} ${isActive ? activeClass : inactiveClass}`}
              draggable
              href={item.href}
              key={`${section.title}-${item.label}`}
              aria-current={isActive ? "page" : undefined}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.href);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const draggedHref = event.dataTransfer.getData("text/plain");
                onReorder(section.title, draggedHref, item.href);
              }}
              onClick={(event) => onNavigate(event, item.href)}
            >
              <span aria-hidden="true" className="absolute left-1 top-1/2 flex h-7 w-3 -translate-y-1/2 items-center justify-center text-[#c7a4a7] opacity-0 transition group-hover:opacity-100" title="Drag to reorder">
                <GripVertical aria-hidden="true" size={14} strokeWidth={2} />
              </span>
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

function CompactNavItem({ item, onNavigate, pathname, tone }: { item: NavItem; onNavigate: NavigationHandler; pathname: string; tone: "customer" | "admin" }) {
  const isActive = isNavItemActive(pathname, item.href);
  const activeClass =
    tone === "admin"
      ? "bg-[#fff1f2] font-semibold text-[#484848] shadow-[inset_3px_0_0_#FF5A5F]"
      : "border border-stone-200/60 bg-white font-medium text-stone-900 shadow-sm";
  const inactiveClass = tone === "admin" ? "font-medium text-[#767676]" : "border border-transparent font-medium text-stone-600";
  const hoverClass =
    isActive
      ? ""
      : tone === "admin"
        ? "hover:bg-[#fff1f2] hover:text-[#FF5A5F]"
        : "hover:bg-stone-200/50 hover:text-stone-900";

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-[14px] transition duration-150 active:scale-[0.99] ${hoverClass} ${isActive ? activeClass : inactiveClass}`}
      href={item.href}
      onClick={(event) => onNavigate(event, item.href)}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isActive && tone !== "admin" ? "text-stone-900" : "text-stone-400 group-hover:text-current"}`}>
        <SidebarIcon name={item.icon} />
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

function UtilityLink({ href, icon, label, detail, onNavigate, tone = "customer" }: NavItem & { detail: string; onNavigate: NavigationHandler; tone?: "customer" | "admin" }) {
  return (
    <Link
      aria-label={label}
      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
        tone === "admin" ? "border-[#ffd1d4] bg-[#fff1f2] hover:bg-[#ffe3e5]" : "border-[#e4e1dc] bg-[#fbfaf8] hover:bg-white"
      }`}
      href={href}
      onClick={(event) => onNavigate(event, href)}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone === "admin" ? "bg-white text-[#FF5A5F]" : "bg-white text-[#6b7280] shadow-sm"}`}>
        <SidebarIcon name={icon} />
      </span>
      <span className="min-w-0">
        <span className={`block text-[14px] font-semibold ${tone === "admin" ? "text-[#484848]" : "text-[#222222]"}`}>{label}</span>
        <span className={`mt-0.5 block text-[12px] leading-4 ${tone === "admin" ? "text-[#767676]" : "text-[#7a7f87]"}`}>{detail}</span>
      </span>
    </Link>
  );
}

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const initials = initialsForName(currentUser.name);

  function handleSignOut() {
    setIsOpen(false);
    window.open("/api/logout", "_self");
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

export function AppShell({ children, sessionRole }: { children: React.ReactNode; sessionRole?: LatticeRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pageTransitionPhase, setPageTransitionPhase] = useState<PageTransitionPhase>("idle");
  const isPublicRoute = publicRoutes.has(pathname);
  const inAdminExperience = isAdminRoute(pathname);
  const navTone = inAdminExperience ? "admin" : "customer";
  const [storedNavOrdersByTone, setStoredNavOrdersByTone] = useState<Record<"admin" | "customer", Record<string, string[]>>>({
    admin: {},
    customer: {},
  });
  const canUseAdminWorkspace = sessionRole === "admin";
  const isPublicSimpleQuoteRoute = pathname === "/simple-quote" || pathname.startsWith("/simple-quote/");
  const activeNavPathname = pendingHref ?? pathname;
  const isRequestQuoteRoute = activeNavPathname === "/requests/new" || activeNavPathname.startsWith("/requests/new/");
  const baseNavSections = inAdminExperience ? adminNavSections : customerNavSections;
  const storedNavOrders = storedNavOrdersByTone[navTone];
  const navSections = baseNavSections.map((section) => applyStoredOrder(section, storedNavOrders[section.title]));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStoredNavOrdersByTone({
        admin: readStoredNavOrder("admin"),
        customer: readStoredNavOrder("customer"),
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

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

  function handleReorderNavItem(sectionTitle: string, draggedHref: string, targetHref: string) {
    if (!draggedHref || draggedHref === targetHref) {
      return;
    }

    const section = navSections.find((section) => section.title === sectionTitle);
    if (!section) {
      return;
    }

    const currentOrder = section.items.map((item) => item.href);
    const fromIndex = currentOrder.indexOf(draggedHref);
    const toIndex = currentOrder.indexOf(targetHref);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const nextSectionOrder = moveItem(currentOrder, fromIndex, toIndex);
    const nextStoredOrders = {
      ...storedNavOrders,
      [sectionTitle]: nextSectionOrder,
    };

    setStoredNavOrdersByTone((currentOrders) => ({
      ...currentOrders,
      [navTone]: nextStoredOrders,
    }));

    try {
      window.localStorage.setItem(navOrderStorageKey(navTone), JSON.stringify(nextStoredOrders));
    } catch {
      // Local personalization should not block navigation if storage is unavailable.
    }
  }

  function handleNavigate(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    if (pathname === href) {
      if (window.location.search) {
        router.replace(href, { scroll: false });
      }
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

  if (isPublicRoute || isPublicSimpleQuoteRoute) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen text-slate-950 ${inAdminExperience ? "bg-[#fff7f7]" : "bg-[#f8f7f4]"}`}>
      <div className="min-h-screen lg:pl-72">
        <aside
          className={`fixed inset-y-0 left-0 z-30 hidden w-72 shrink-0 overflow-y-auto border-r px-4 py-5 shadow-[4px_0_24px_rgba(0,0,0,0.03)] [scrollbar-width:none] lg:flex lg:flex-col [&::-webkit-scrollbar]:hidden ${
            inAdminExperience ? "border-[#ffd1d4] bg-[#fff7f7]" : "border-[#e8e3da] bg-[#fbfaf7]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LatticeMark onNavigate={handleNavigate} tone={inAdminExperience ? "admin" : "customer"} />
                <div>
                  <p className="text-[16px] font-semibold leading-5 text-[#171717]">Lattice OS</p>
                </div>
              </div>
              {!inAdminExperience ? <NotificationLink onNavigate={handleNavigate} pathname={activeNavPathname} /> : null}
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
              <div className="mt-12 rounded-md border border-[#ffd1d4] bg-[#fff1f2] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#767676]">Admin mode</p>
                <p className="mt-2 text-[14px] leading-5 text-[#484848]">A focused workspace for quote requests and supplier follow-up.</p>
              </div>
            ) : null}

            <nav className="mt-6 space-y-7">
              {navSections.map((section) => (
                <DesktopNavSection
                  key={section.title}
                  onNavigate={handleNavigate}
                  pathname={activeNavPathname}
                  section={section}
                  onReorder={handleReorderNavItem}
                  tone={navTone}
                />
              ))}
            </nav>
          </div>

          <div className="mt-auto space-y-4 pt-4">
            {inAdminExperience ? (
              <UtilityLink detail="Use the customer portal for development." href="/dashboard" icon="back" label="Customer workspace" onNavigate={handleNavigate} tone="admin" />
            ) : null}
            {!inAdminExperience && canUseAdminWorkspace ? (
              <UtilityLink detail="Return to internal controls." href="/admin/quotes" icon="admin" label="Admin workspace" onNavigate={handleNavigate} />
            ) : null}
            <ProfileMenu />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-10 border-b px-5 py-4 backdrop-blur lg:hidden ${
              inAdminExperience ? "border-[#ffd1d4] bg-[#fff1f2]/95" : "border-slate-200 bg-white/90"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <LatticeMark onNavigate={handleNavigate} tone={inAdminExperience ? "admin" : "customer"} />
              <div className="flex items-center gap-2">
                {!inAdminExperience ? <NotificationLink onNavigate={handleNavigate} pathname={activeNavPathname} /> : null}
                {!inAdminExperience && canUseAdminWorkspace ? (
                  <Link
                    className="rounded-xl bg-[#171717] px-3 py-2 text-sm font-semibold text-white"
                    href="/admin/quotes"
                    onClick={(event) => handleNavigate(event, "/admin/quotes")}
                  >
                    Admin
                  </Link>
                ) : (
                  <span className={`rounded-xl px-3 py-2 text-sm font-semibold ${inAdminExperience ? "bg-[#fff1f2] text-[#484848]" : "bg-[#ffffff] text-[#303036]"}`}>
                    {inAdminExperience ? "Admin" : "Customer"}
                  </span>
                )}
              </div>
            </div>
            <nav aria-label="Compact navigation" className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navSections.flatMap((section) => section.items).map((item) => (
                <CompactNavItem
                  item={item}
                  key={`mobile-${item.href}`}
                  onNavigate={handleNavigate}
                  pathname={activeNavPathname}
                  tone={navTone}
                />
              ))}
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
