"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { currentUser, initialsForName } from "@/lib/current-user";

type IconName = "home" | "analytics" | "project" | "card" | "money" | "admin" | "factory" | "queue" | "back" | "user" | "logout";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const customerNavSections: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "Home", icon: "home" },
      { href: "/requests/new", label: "Request Quote", icon: "card" },
      { href: "/quotes", label: "Quotes", icon: "money" },
      { href: "/orders", label: "Orders", icon: "factory" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/materials", label: "Materials", icon: "card" },
      { href: "/capabilities", label: "Capabilities", icon: "money" },
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
      { href: "/admin/quotes", label: "Quote Submissions", icon: "money" },
      { href: "/admin/quotes/builder", label: "Quote Builder", icon: "card" },
      { href: "/admin/orders", label: "Placed Orders", icon: "factory" },
      { href: "/operator/requests", label: "RFQ Queue", icon: "queue" },
    ],
  },
];

const adminRoutePrefixes = ["/admin", "/analytics", "/projects", "/operator"];

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
  const common = {
    className: "h-5 w-5 stroke-[1.7] text-[#8d8d8d]",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 32 32",
  };

  if (name === "home") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M5.5 15.2 16 5.8l10.5 9.4" />
        <path d="M8.5 14.2v12h6.1v-7.1h2.8v7.1h6.1v-12" />
      </svg>
    );
  }

  if (name === "analytics") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M5.5 25.5h21" />
        <path d="M7.5 25.5v-7h4.2v7" />
        <path d="M13.9 25.5v-12h4.2v12" />
        <path d="M20.3 25.5v-17h4.2v17" />
      </svg>
    );
  }

  if (name === "admin") {
    return (
      <svg aria-hidden="true" {...common}>
        <rect height="17" rx="2" width="21" x="5.5" y="8" />
        <path d="M9.5 13h13" />
        <path d="M9.5 17h6" />
        <path d="M19 20.5h3.5" />
        <path d="M20.8 18.7v3.6" />
      </svg>
    );
  }

  if (name === "queue") {
    return (
      <svg aria-hidden="true" {...common}>
        <rect height="18" rx="2" width="20" x="6" y="7" />
        <path d="M10 12h12" />
        <path d="M10 16h12" />
        <path d="M10 20h7" />
      </svg>
    );
  }

  if (name === "back") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M14 8 6 16l8 8" />
        <path d="M7 16h19" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg aria-hidden="true" {...common}>
        <circle cx="16" cy="10.5" r="4" />
        <path d="M8.5 25c.8-4.4 3.4-7 7.5-7s6.7 2.6 7.5 7" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M13 8H7.5v16H13" />
        <path d="M16 16h10" />
        <path d="m22 12 4 4-4 4" />
      </svg>
    );
  }

  if (name === "project") {
    return (
      <svg aria-hidden="true" {...common}>
        <circle cx="16" cy="7.8" r="2.3" />
        <path d="M7.3 12.7h17.4" />
        <path d="m16 13.3-4.2 4.6-4.5-1.4" />
        <path d="m16 13.3 4.2 4.6 4.5-1.4" />
        <path d="M16 13.3v13" />
        <path d="m16 20.1-4.9 6.1" />
        <path d="m16 20.1 4.9 6.1" />
      </svg>
    );
  }

  if (name === "factory") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M5.5 25.5h21" />
        <path d="M7.5 25.5V13.8l5.8 3.2v-3.2l5.8 3.2v-6.5h5.4v15" />
        <path d="M10.5 21h2.4" />
        <path d="M16 21h2.4" />
        <path d="M21.5 21h2.4" />
      </svg>
    );
  }

  if (name === "card") {
    return (
      <svg aria-hidden="true" {...common}>
        <rect height="13.5" rx="1.2" width="22" x="5" y="9.5" />
        <path d="M5 14h22" />
        <path d="M9.2 19.2h4.2" />
        <path d="M21.5 19.2h1.3" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...common}>
      <rect height="12.4" rx="1.2" width="23" x="4.5" y="10" />
      <circle cx="16" cy="16.2" r="3" />
      <path d="M4.5 13.2c2.2 0 4-1.2 4.5-3.2" />
      <path d="M27.5 13.2c-2.2 0-4-1.2-4.5-3.2" />
      <path d="M4.5 19.2c2.2 0 4 1.2 4.5 3.2" />
      <path d="M27.5 19.2c-2.2 0-4 1.2-4.5 3.2" />
    </svg>
  );
}

function LatticeMark({ tone = "customer" }: { tone?: "customer" | "admin" }) {
  const isAdmin = tone === "admin";

  return (
    <Link
      aria-label="Lattice home"
      className={`flex h-12 w-12 items-center justify-center rounded-md ${isAdmin ? "bg-[#4f3424]" : "bg-[#2f3237]"}`}
      href="/dashboard"
    >
      <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 28 28">
        <path d="M14 2.8 23.8 8.4v11.2L14 25.2 4.2 19.6V8.4L14 2.8Z" fill={isAdmin ? "#FFD3AC" : "#f6f7f8"} opacity="0.92" />
        <path d="M14 2.8v11.3l9.8 5.5M14 14.1 4.2 19.6M14 14.1l9.8-5.7M14 14.1 4.2 8.4" fill="none" stroke={isAdmin ? "#a26943" : "#62666d"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    </Link>
  );
}

function DesktopNavSection({ section, pathname, tone }: { section: NavSection; pathname: string; tone: "customer" | "admin" }) {
  return (
    <section className="space-y-2 border-b border-[#eeeeee] pb-5 last:border-b-0">
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone === "admin" ? "text-[#7a4d2d]" : "text-[#181818]"}`}>{section.title}</p>
      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const activeClass =
            tone === "admin"
              ? "bg-[#FFD3AC] font-semibold text-[#3a281d] shadow-[inset_3px_0_0_#a26943]"
              : "font-semibold text-[#222222]";
          const inactiveClass = tone === "admin" ? "font-medium text-[#80614d]" : "font-medium text-[#8c8c8c]";
          const hoverClass = tone === "admin" ? "hover:bg-[#fff1e4] hover:text-[#4f3424]" : "hover:bg-[#f7f7f7] hover:text-[#555555]";

          return (
            <Link
              className={`group flex min-h-10 items-center gap-4 rounded-md px-3 text-[15px] transition ${hoverClass} ${isActive ? activeClass : inactiveClass}`}
              href={item.href}
              key={`${section.title}-${item.label}`}
              aria-current={isActive ? "page" : undefined}
            >
              <SidebarIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function UtilityLink({ href, icon, label, detail, tone = "customer" }: NavItem & { detail: string; tone?: "customer" | "admin" }) {
  return (
    <Link
      className={`flex items-center gap-3 rounded-md border p-2 transition ${
        tone === "admin" ? "border-[#efb987] bg-[#fff6ee] hover:bg-[#ffe8d3]" : "border-[#eeeeee] bg-[#fafafa] hover:bg-[#f4f4f5]"
      }`}
      href={href}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tone === "admin" ? "bg-[#FFD3AC]" : "bg-white"}`}>
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

  return (
    <div className="relative border-t border-[#eeeeee] pt-3">
      {isOpen ? (
        <div className="absolute bottom-[76px] left-0 right-0 rounded-md border border-[#eeeeee] bg-white py-2 shadow-sm">
          <Link className="flex min-h-11 items-center gap-3 px-3 text-[14px] font-medium text-[#73737c] transition hover:bg-[#f7f7f7] hover:text-[#222222]" href="/account/settings">
            <SidebarIcon name="user" />
            <span>Account Settings</span>
          </Link>
          <button
            className="flex min-h-11 w-full items-center gap-3 px-3 text-left text-[14px] font-medium text-[#73737c] transition hover:bg-[#f7f7f7] hover:text-[#222222]"
            type="button"
          >
            <SidebarIcon name="logout" />
            <span>Sign Out</span>
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2f3237] text-[12px] font-semibold text-white">
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/" || pathname === "/login" || pathname === "/waiting-list";
  const inAdminExperience = isAdminRoute(pathname);
  const navSections = inAdminExperience ? adminNavSections : customerNavSections;

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen text-slate-950 ${inAdminExperience ? "bg-[#fff4ea]" : "bg-[#f7f7f7]"}`}>
      <div className="min-h-screen lg:pl-60">
        <aside
          className={`fixed inset-y-0 left-0 z-30 hidden w-60 shrink-0 overflow-y-auto px-3 py-5 shadow-[2px_0_8px_rgba(15,23,42,0.04)] [scrollbar-width:none] lg:flex lg:flex-col [&::-webkit-scrollbar]:hidden ${
            inAdminExperience ? "border-r border-[#efc29a] bg-[#fffaf6]" : "bg-white"
          }`}
        >
          <div>
            <LatticeMark tone={inAdminExperience ? "admin" : "customer"} />

            {!inAdminExperience ? (
              <Link
                className="mt-12 flex h-[30px] w-[135px] items-center justify-center rounded-sm bg-[#858585] px-4 text-[14px] font-semibold text-white transition hover:bg-[#737373]"
                href="/requests/new"
              >
                Request Quote
              </Link>
            ) : (
              <div className="mt-12 rounded-md border border-[#efb987] bg-[#FFD3AC] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f4529]">Admin mode</p>
                <p className="mt-2 text-[14px] leading-5 text-[#3a281d]">A focused workspace for quote requests and supplier follow-up.</p>
              </div>
            )}

            <nav className="mt-4 space-y-5">
              {navSections.map((section) => (
                <DesktopNavSection key={section.title} pathname={pathname} section={section} tone={inAdminExperience ? "admin" : "customer"} />
              ))}
            </nav>
          </div>

          <div className="mt-auto space-y-4 pt-4">
            {inAdminExperience ? (
              <UtilityLink detail="Return to the customer workspace." href="/dashboard" icon="back" label="Customer App" tone="admin" />
            ) : (
              <UtilityLink detail="Open internal controls." href="/admin" icon="admin" label="Admin" />
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
              <LatticeMark tone={inAdminExperience ? "admin" : "customer"} />
              <Link
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${inAdminExperience ? "bg-[#FFD3AC] text-[#3a281d]" : "bg-[#858585] text-white"}`}
                href={inAdminExperience ? "/dashboard" : "/admin"}
              >
                {inAdminExperience ? "Customer App" : "Admin"}
              </Link>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm font-medium text-slate-600">
              {navSections.flatMap((section) => section.items).map((item) => {
                const isActive = isNavItemActive(pathname, item.href);

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-full border px-3 py-1.5 ${
                      inAdminExperience
                        ? isActive
                          ? "border-[#a26943] bg-[#FFD3AC] font-semibold text-[#3a281d]"
                          : "border-[#efb987] bg-[#fffaf6] text-[#5c3d28]"
                        : isActive
                          ? "border-slate-950 bg-slate-950 font-semibold text-white"
                          : "border-slate-200 bg-white"
                    }`}
                    href={item.href}
                    key={`mobile-${item.label}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="w-full px-6 py-5 lg:px-12 lg:py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
