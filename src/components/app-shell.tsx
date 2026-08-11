"use client";

import { ArrowLeft, Bell, ClipboardList, Factory, FileCheck, FileSearch, FileText, GripVertical, Inbox, Layers, LayoutDashboard, LogOut, Map as MapIcon, Settings, User, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { currentUser, initialsForName } from "@/lib/current-user";
import type { LatticeRole } from "@/lib/auth-crypto";

type IconName = "home" | "analytics" | "project" | "money" | "admin" | "factory" | "queue" | "back" | "user" | "logout" | "resources" | "roadmap" | "quality";

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

type NavigationOptions = {
  keepNotificationsPanelOpen?: boolean;
};
type NavigationHandler = (event: React.MouseEvent<HTMLAnchorElement>, href: string, options?: NavigationOptions) => void;
type ReorderHandler = (sectionTitle: string, draggedHref: string, targetHref: string) => void;

type SidebarNotificationItem = {
  actionRequired: boolean;
  detail: string;
  href: string;
  id: string;
  meta: string;
  occurredAt: string;
  time: string;
  title: string;
};

type SidebarNotificationResponse = {
  attentionCount: number;
  items: SidebarNotificationItem[];
  totalCount: number;
};

const pageTransition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
};
const dayInMilliseconds = 24 * 60 * 60 * 1000;
const notificationDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
});

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
      { href: "/roadmap", label: "Lattice OS Roadmap", icon: "roadmap" },
      { href: "/materials", label: "Materials", icon: "analytics" },
      { href: "/capabilities", label: "Capabilities", icon: "queue" },
      { href: "/equipment", label: "Equipment", icon: "factory" },
      { href: "/quality-documentation", label: "Inspection & Certificates", icon: "quality" },
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
      { href: "/admin/material-inquiries", label: "Material Inquiries", icon: "analytics" },
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
  quality: FileCheck,
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

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function notificationAgeInDays(occurredAt: string) {
  const date = new Date(occurredAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((startOfLocalDay(new Date()) - startOfLocalDay(date)) / dayInMilliseconds));
}

function notificationSectionLabel(item: SidebarNotificationItem) {
  const ageInDays = notificationAgeInDays(item.occurredAt);

  if (ageInDays === null || ageInDays < 7) {
    return "This week";
  }

  if (ageInDays < 14) {
    return "Last week";
  }

  return "Older";
}

function notificationTimeLabel(item: SidebarNotificationItem) {
  const ageInDays = notificationAgeInDays(item.occurredAt);

  if (ageInDays === null) {
    return item.time;
  }

  if (ageInDays < 7) {
    return ageInDays === 0 ? "Today" : `${ageInDays}d`;
  }

  return notificationDateFormatter.format(new Date(item.occurredAt));
}

function groupSidebarNotifications(items: SidebarNotificationItem[]) {
  const groups = [
    { items: [] as SidebarNotificationItem[], label: "This week" },
    { items: [] as SidebarNotificationItem[], label: "Last week" },
    { items: [] as SidebarNotificationItem[], label: "Older" },
  ];

  for (const item of items) {
    const label = notificationSectionLabel(item);
    const group = groups.find((candidate) => candidate.label === label);
    group?.items.push(item);
  }

  return groups.filter((group) => group.items.length > 0);
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

function NotificationButton({
  isOpen,
  onClick,
  pathname,
}: {
  isOpen: boolean;
  onClick: () => void;
  pathname: string;
}) {
  const isActive = isNavItemActive(pathname, "/notifications");

  return (
    <button
      aria-current={isActive ? "page" : undefined}
      aria-expanded={isOpen}
      aria-label="Notifications"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
        isActive || isOpen
          ? "border-stone-300 bg-white text-stone-950 shadow-sm"
          : "border-transparent text-stone-500 hover:border-stone-200 hover:bg-white hover:text-stone-950"
      }`}
      onClick={onClick}
      title="Notifications"
      type="button"
    >
      <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
    </button>
  );
}

function SidebarNotificationsPanel({
  items,
  onNavigate,
  status,
}: {
  items: SidebarNotificationItem[];
  onNavigate: NavigationHandler;
  status: "idle" | "loading" | "loaded" | "error";
}) {
  const notificationGroups = groupSidebarNotifications(items);

  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col">
      <section className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {status === "loading" && items.length === 0 ? (
          <div className="space-y-0 border-t border-stone-200">
            {[0, 1, 2].map((index) => (
              <div className="animate-pulse border-b border-stone-200 py-4" key={index}>
                <div className="h-3 w-24 rounded bg-stone-200" />
                <div className="mt-3 h-4 w-40 rounded bg-stone-200" />
                <div className="mt-2 h-3 w-full rounded bg-stone-100" />
              </div>
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-[13px] font-semibold text-amber-900">Notifications could not load.</p>
            <p className="mt-1 text-[12px] leading-4 text-amber-800">The full notification page is still available.</p>
          </div>
        ) : null}

        {status === "loaded" && items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[14px] font-semibold text-stone-900">No updates yet.</p>
            <p className="mx-auto mt-2 max-w-[220px] text-[12px] leading-5 text-stone-500">RFQ, quote, order, shipment, and document events will appear here.</p>
          </div>
        ) : null}

        {notificationGroups.length > 0 ? (
          <div className="space-y-6">
            {notificationGroups.map((group) => (
              <section key={group.label}>
                <h2 className="px-2 pb-3 text-[13px] font-semibold text-stone-600">{group.label}</h2>
                <div className="border-t border-stone-200">
                  {group.items.map((item) => (
                    <Link
                      className="group grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-stone-200 px-2 py-4 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                      href={item.href}
                      key={item.id}
                      onClick={(event) => onNavigate(event, item.href, { keepNotificationsPanelOpen: true })}
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold leading-5 text-stone-950">{item.title}</span>
                        <span className="mt-1 line-clamp-2 text-[12px] leading-5 text-stone-500">{item.detail}</span>
                        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] text-stone-500">
                          <span aria-label={item.actionRequired ? "Needs attention" : "Informational update"} className={`h-2 w-2 shrink-0 rounded-full ${item.actionRequired ? "bg-amber-600" : "bg-stone-300"}`} />
                          <span className="truncate">{item.meta}</span>
                        </span>
                      </span>
                      <span className="pt-1 text-[12px] font-medium text-stone-400">{notificationTimeLabel(item)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </section>

      <Link
        className="mt-3 flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-[14px] font-semibold text-stone-800 transition hover:border-stone-300 hover:bg-stone-50"
        href="/notifications"
        onClick={(event) => onNavigate(event, "/notifications")}
      >
        View all notifications
      </Link>
    </div>
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
              ? "border border-[#e4e1dc] bg-white font-semibold text-[#484848] shadow-sm"
              : "border border-stone-200/60 bg-white font-medium text-stone-900 shadow-sm";
          const inactiveClass = tone === "admin" ? "border border-transparent font-medium text-[#767676]" : "border border-transparent font-medium text-stone-600";
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
      ? "border border-[#e4e1dc] bg-white font-semibold text-[#484848] shadow-sm"
      : "border border-stone-200/60 bg-white font-medium text-stone-900 shadow-sm";
  const inactiveClass = tone === "admin" ? "border border-transparent font-medium text-[#767676]" : "border border-transparent font-medium text-stone-600";
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initials = initialsForName(currentUser.name);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function handleSignOut() {
    setIsOpen(false);
    window.open("/api/logout", "_self");
  }

  function handleProfileNavigation() {
    setIsOpen(false);
    router.push("/account/settings");
  }

  return (
    <div className="relative border-t border-[#ebe7df] pt-3" ref={menuRef}>
      {isOpen ? (
        <div className="absolute bottom-[76px] left-0 right-0 rounded-2xl border border-[#e4e1dc] bg-white py-2 shadow-lg shadow-black/5">
          <Link className="flex min-h-11 items-center gap-3 px-3 text-[14px] font-medium text-[#73737c] transition hover:bg-[#f7f7f7] hover:text-[#222222]" href="/account/settings" onClick={() => setIsOpen(false)}>
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

      <div
        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e4e1dc] bg-white p-2 shadow-sm transition hover:border-[#d8d2c8] hover:bg-[#fbfaf8] focus-within:border-[#cfc7bc]"
        onClick={handleProfileNavigation}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleProfileNavigation();
          }
        }}
        role="link"
        tabIndex={0}
      >
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
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen((current) => !current);
          }}
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
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [sidebarNotifications, setSidebarNotifications] = useState<SidebarNotificationResponse>({
    attentionCount: 0,
    items: [],
    totalCount: 0,
  });
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

  useEffect(() => {
    if (!isNotificationsPanelOpen || inAdminExperience) {
      return;
    }

    const controller = new AbortController();

    async function loadNotifications() {
      setNotificationStatus("loading");

      try {
        const response = await fetch("/api/customer-notifications", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load notifications.");
        }

        const payload = (await response.json()) as SidebarNotificationResponse;
        setSidebarNotifications(payload);
        setNotificationStatus("loaded");
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setNotificationStatus("error");
      }
    }

    void loadNotifications();

    return () => controller.abort();
  }, [inAdminExperience, isNotificationsPanelOpen]);

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

  function handleNavigate(event: React.MouseEvent<HTMLAnchorElement>, href: string, options: NavigationOptions = {}) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    if (!options.keepNotificationsPanelOpen) {
      setIsNotificationsPanelOpen(false);
    }

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

  function handleMainClick() {
    setIsNotificationsPanelOpen(false);
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
              {!inAdminExperience ? <NotificationButton isOpen={isNotificationsPanelOpen} onClick={() => setIsNotificationsPanelOpen((current) => !current)} pathname={activeNavPathname} /> : null}
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
          </div>

          {isNotificationsPanelOpen && !inAdminExperience ? (
            <SidebarNotificationsPanel
              items={sidebarNotifications.items}
              onNavigate={handleNavigate}
              status={notificationStatus}
            />
          ) : (
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
          )}

          {!isNotificationsPanelOpen ? <div className="mt-auto space-y-4 pt-4">
            {inAdminExperience ? (
              <UtilityLink detail="Use the customer portal for development." href="/dashboard" icon="back" label="Customer workspace" onNavigate={handleNavigate} tone="admin" />
            ) : null}
            {!inAdminExperience && canUseAdminWorkspace ? (
              <UtilityLink detail="Return to internal controls." href="/admin/quotes" icon="admin" label="Admin workspace" onNavigate={handleNavigate} />
            ) : null}
            <ProfileMenu />
          </div> : null}
        </aside>

        {isNotificationsPanelOpen && !inAdminExperience ? (
          <div className="fixed inset-0 z-40 bg-stone-950/30 backdrop-blur-sm lg:hidden">
            <aside className="flex h-full w-full max-w-[360px] flex-col border-r border-[#e8e3da] bg-[#fbfaf7] px-4 py-5 shadow-2xl">
              <div className="mb-3 flex justify-end">
                <button
                  aria-label="Close notifications"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 transition hover:bg-white hover:text-stone-950"
                  onClick={() => setIsNotificationsPanelOpen(false)}
                  type="button"
                >
                  <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.9} />
                </button>
              </div>
              <SidebarNotificationsPanel
                items={sidebarNotifications.items}
                onNavigate={handleNavigate}
                status={notificationStatus}
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-10 border-b px-5 py-4 backdrop-blur lg:hidden ${
              inAdminExperience ? "border-[#ffd1d4] bg-[#fff1f2]/95" : "border-slate-200 bg-white/90"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <LatticeMark onNavigate={handleNavigate} tone={inAdminExperience ? "admin" : "customer"} />
              <div className="flex items-center gap-2">
                {!inAdminExperience ? <NotificationButton isOpen={isNotificationsPanelOpen} onClick={() => setIsNotificationsPanelOpen((current) => !current)} pathname={activeNavPathname} /> : null}
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

          <main className="relative w-full overflow-x-hidden" onClick={handleMainClick}>
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
