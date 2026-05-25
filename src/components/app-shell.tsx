"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName = "home" | "analytics" | "project" | "card" | "money" | "admin" | "factory";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Admin",
    items: [
      { href: "/", label: "Home", icon: "home" },
      { href: "/admin", label: "Admin Center", icon: "admin" },
      { href: "/analytics", label: "Analytics", icon: "analytics" },
      { href: "/projects", label: "Project Management", icon: "project" },
    ],
  },
  {
    title: "Manage",
    items: [
      { href: "/quotes", label: "Our Quotes", icon: "card" },
      { href: "/orders", label: "Our Orders", icon: "money" },
      { href: "/supplier/orders", label: "Supplier Portal", icon: "factory" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/materials", label: "Materials", icon: "card" },
      { href: "/capabilities", label: "Capabilities", icon: "money" },
    ],
  },
];

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

function LatticeMark() {
  return (
    <Link aria-label="Lattice home" className="flex h-12 w-12 items-center justify-center rounded-md bg-[#2f3237]" href="/">
      <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 28 28">
        <path d="M14 2.8 23.8 8.4v11.2L14 25.2 4.2 19.6V8.4L14 2.8Z" fill="#f6f7f8" opacity="0.92" />
        <path d="M14 2.8v11.3l9.8 5.5M14 14.1 4.2 19.6M14 14.1l9.8-5.7M14 14.1 4.2 8.4" fill="none" stroke="#62666d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    </Link>
  );
}

function DesktopNavSection({ section, pathname }: { section: NavSection; pathname: string }) {
  return (
    <section className="space-y-3 border-b border-[#eeeeee] pb-7 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#181818]">{section.title}</p>
      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              className={`group flex min-h-11 items-center gap-4 rounded-md px-3 text-[15px] transition hover:bg-[#f7f7f7] hover:text-[#555555] ${
                isActive ? "font-semibold text-[#222222]" : "font-medium text-[#8c8c8c]"
              }`}
              href={item.href}
              key={`${section.title}-${item.label}`}
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 border-r border-[#f1f1f1] bg-white px-3 py-9 lg:block">
          <LatticeMark />

          <Link
            className="mt-12 flex h-[30px] w-[135px] items-center justify-center rounded-sm bg-[#858585] px-4 text-[14px] font-semibold text-white transition hover:bg-[#737373]"
            href="/requests/new"
          >
            Request Quote
          </Link>

          <nav className="mt-5 space-y-7">
            {navSections.map((section) => (
              <DesktopNavSection key={section.title} pathname={pathname} section={section} />
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <LatticeMark />
              <Link className="rounded-xl bg-[#858585] px-3 py-2 text-sm font-semibold text-white" href="/requests/new">
                Request Quote
              </Link>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm font-medium text-slate-600">
              {navSections[0].items.map((item) => (
                <Link className="rounded-full border border-slate-200 bg-white px-3 py-1.5" href={item.href} key={`mobile-${item.label}`}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          <main className="w-full px-6 py-5 lg:px-12 lg:py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
