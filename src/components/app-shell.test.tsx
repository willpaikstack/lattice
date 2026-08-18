import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

const mockUsePathname = vi.fn(() => "/dashboard");
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock("motion/react", async () => {
  const React = await import("react");

  type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
    animate?: { opacity?: number } | boolean;
    children?: ReactNode;
    initial?: unknown;
    onAnimationComplete?: () => void;
    transition?: unknown;
  };

  function MotionDiv({ animate, children, initial, onAnimationComplete, transition, ...props }: MotionDivProps) {
    void initial;
    void transition;

    React.useEffect(() => {
      if (typeof animate === "object" && animate?.opacity === 0) {
        onAnimationComplete?.();
      }
    }, [animate, onAnimationComplete]);

    return <div {...props}>{children}</div>;
  }

  return {
    motion: {
      div: MotionDiv,
    },
  };
});

function expectAllLinksNamed(label: string, href: string) {
  const links = screen.getAllByRole("link", { name: label });
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    expect(link).toHaveAttribute("href", href);
  }
}

describe("AppShell", () => {
  beforeEach(() => {
    const localStorageData: Record<string, string> = {};

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: vi.fn(() => {
          for (const key of Object.keys(localStorageData)) {
            delete localStorageData[key];
          }
        }),
        getItem: vi.fn((key: string) => localStorageData[key] ?? null),
        removeItem: vi.fn((key: string) => {
          delete localStorageData[key];
        }),
        setItem: vi.fn((key: string, value: string) => {
          localStorageData[key] = value;
        }),
      },
    });
    window.history.pushState({}, "", "/dashboard");
    mockUsePathname.mockReturnValue("/dashboard");
    mockPush.mockReset();
    mockReplace.mockReset();
    const now = new Date();
    const twoDaysAgo = new Date(now);
    const tenDaysAgo = new Date(now);
    const twentyDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    tenDaysAgo.setDate(now.getDate() - 10);
    twentyDaysAgo.setDate(now.getDate() - 20);
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              attentionCount: 1,
              items: [
                {
                  actionRequired: true,
                  detail: "Your quote is ready to review.",
                  href: "/quotes/req_quoted",
                  id: "quote:req_quoted:customer_quote_1",
                  meta: "RFQ Progress",
                  occurredAt: twoDaysAgo.toISOString(),
                  time: "2 Jun 2026",
                  title: "Quote ready for review",
                },
                {
                  actionRequired: false,
                  detail: "Lattice received your RFQ and is reviewing the files.",
                  href: "/quotes/req_last_week",
                  id: "status-event:req_last_week:event_submitted",
                  meta: "RFQ status",
                  occurredAt: tenDaysAgo.toISOString(),
                  time: "27 Jul 2026",
                  title: "RFQ submitted",
                },
                {
                  actionRequired: false,
                  detail: "Buyer opened the RFQ workspace.",
                  href: "/requests/new?draft=req_older",
                  id: "status-event:req_older:event_draft",
                  meta: "RFQ status",
                  occurredAt: twentyDaysAgo.toISOString(),
                  time: "17 Jul 2026",
                  title: "Draft created",
                },
              ],
              totalCount: 3,
            }),
          ok: true,
        }),
      ),
    );
  });

  it("leaves the public landing page outside the app shell", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <AppShell>
        <div>landing content</div>
      </AppShell>,
    );

    expect(screen.getByText("landing content")).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("William Paik")).not.toBeInTheDocument();
  });

  it("leaves the public login page outside the app shell", () => {
    mockUsePathname.mockReturnValue("/login");

    render(
      <AppShell>
        <div>login content</div>
      </AppShell>,
    );

    expect(screen.getByText("login content")).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("William Paik")).not.toBeInTheDocument();
  });

  it("leaves nested Clerk login challenges outside the app shell", () => {
    mockUsePathname.mockReturnValue("/login/client-trust");

    render(
      <AppShell>
        <div>client trust challenge</div>
      </AppShell>,
    );

    expect(screen.getByText("client trust challenge")).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("William Paik")).not.toBeInTheDocument();
  });

  it("leaves forced password setup outside the app shell", () => {
    mockUsePathname.mockReturnValue("/account/set-password");

    render(
      <AppShell>
        <div>password setup</div>
      </AppShell>,
    );

    expect(screen.getByText("password setup")).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("William Paik")).not.toBeInTheDocument();
  });

  it("leaves the post-sign-in account check outside the app shell", () => {
    mockUsePathname.mockReturnValue("/account/continue");

    render(
      <AppShell>
        <div>account check</div>
      </AppShell>,
    );

    expect(screen.getByText("account check")).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
  });

  it("leaves the public forgot password page outside the app shell", () => {
    mockUsePathname.mockReturnValue("/forgot-password");

    render(
      <AppShell>
        <div>forgot password content</div>
      </AppShell>,
    );

    expect(screen.getByText("forgot password content")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(screen.queryByText("William Paik")).not.toBeInTheDocument();
  });

  it("leaves the public waiting list page outside the app shell", () => {
    mockUsePathname.mockReturnValue("/waiting-list");

    render(
      <AppShell>
        <div>waiting list content</div>
      </AppShell>,
    );

    expect(screen.getByText("waiting list content")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(screen.queryByText("William Paik")).not.toBeInTheDocument();
  });

  it("leaves the public how it works page outside the app shell", () => {
    mockUsePathname.mockReturnValue("/how-it-works");

    render(
      <AppShell>
        <div>how it works content</div>
      </AppShell>,
    );

    expect(screen.getByText("how it works content")).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("William Paik")).not.toBeInTheDocument();
  });

  it("keeps customer navigation separate from admin pages", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expectAllLinksNamed("Home", "/dashboard");
    expectAllLinksNamed("Request Quote", "/requests/new");
    expectAllLinksNamed("Quotes", "/quotes");
    expectAllLinksNamed("Orders", "/orders");
    expect(screen.getAllByRole("button", { name: "Notifications" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Lattice OS Roadmap" })).not.toBeInTheDocument();
    expectAllLinksNamed("Materials", "/materials");
    expectAllLinksNamed("Capabilities", "/capabilities");
    expectAllLinksNamed("Inspection & Certificates", "/quality-documentation");
    expect(screen.getAllByText("Your Resources").length).toBeGreaterThan(0);
    expect(screen.getByText("William Paik")).toBeInTheDocument();
    expect(screen.getByText("will@latticeos.co")).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Project Management" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "RFQ Queue" })).not.toBeInTheDocument();
  });

  it("keeps the customer sidebar header while the bell swaps the content below it", async () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Notifications" })[0]);

    expect(screen.getAllByRole("link", { name: "Lattice home" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Request Quote" }).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("This week")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Last week").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Older").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2d").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Search notifications" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh notifications" })).not.toBeInTheDocument();
    expect(screen.queryByText("Priority")).not.toBeInTheDocument();
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(screen.queryByText("1 need attention")).not.toBeInTheDocument();
    const notificationLink = screen.getAllByRole("link", { name: /Quote ready for review/ })[0];
    expect(notificationLink).toHaveAttribute("href", "/quotes/req_quoted");
    expect(notificationLink).toHaveClass("border-b", "border-stone-200");
    expect(notificationLink.querySelector("svg")).toBeNull();
    expect(screen.getAllByRole("link", { name: "View all notifications" })[0]).toHaveAttribute("href", "/notifications");
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();

    fireEvent.click(notificationLink);

    expect(screen.getAllByText("This week").length).toBeGreaterThan(0);
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("content"));

    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Notifications" })[0]);
    expect(screen.getAllByText("This week").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("link", { name: "Lattice home" })[0]);

    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(0);
  });

  it("lets admin sessions return to the admin workspace from customer routes", () => {
    render(
      <AppShell sessionRole="admin">
        <div>customer content</div>
      </AppShell>,
    );

    expectAllLinksNamed("Admin workspace", "/admin/quotes");
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin/quotes");
  });

  it("keeps request quote as a primary CTA instead of a workspace nav item", () => {
    mockUsePathname.mockReturnValue("/requests/new");

    render(
      <AppShell>
        <div>request form</div>
      </AppShell>,
    );

    const requestQuoteLinks = screen.getAllByRole("link", { name: "Request Quote" });

    expect(requestQuoteLinks).toHaveLength(1);
    expect(requestQuoteLinks[0]).toHaveAttribute("href", "/requests/new");
    expect(requestQuoteLinks[0]).toHaveAttribute("aria-current", "page");
    expect(requestQuoteLinks[0]).toHaveClass("border-stone-200/60", "bg-white", "font-medium", "text-stone-900", "shadow-sm");
  });

  it("keeps compact navigation as a row of sidebar-style links with icons", () => {
    mockUsePathname.mockReturnValue("/quotes/demo_submitted");

    render(
      <AppShell>
        <div>quote detail</div>
      </AppShell>,
    );

    const quoteLinks = screen.getAllByRole("link", { name: "Quotes" });
    const compactQuoteLink = quoteLinks.at(-1);
    const compactNavigation = screen.getByRole("navigation", { name: "Compact navigation" });

    expect(compactNavigation).toHaveClass("flex", "overflow-x-auto");
    expect(compactQuoteLink).toHaveClass("rounded-lg", "gap-3");
    expect(compactQuoteLink).not.toHaveClass("rounded-full");
    expect(compactQuoteLink?.querySelector("svg")).not.toBeNull();
  });

  it("keeps desktop navigation labels aligned with the icon slot", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    const desktopHomeLink = screen.getAllByRole("link", { name: "Home" })[0];
    const directSpans = Array.from(desktopHomeLink.children).filter((child) => child.tagName.toLowerCase() === "span");

    expect(desktopHomeLink).toHaveClass("relative", "gap-3", "px-3");
    expect(directSpans[0]).toHaveClass("absolute");
    expect(directSpans[1]).toHaveClass("h-7", "w-7", "shrink-0");
  });

  it("uses admin-only navigation on quote submissions", () => {
    mockUsePathname.mockReturnValue("/admin/quotes");

    render(
      <AppShell sessionRole="admin">
        <div>content</div>
      </AppShell>,
    );

    expectAllLinksNamed("Lattice admin home", "/admin/quotes");
    expectAllLinksNamed("Customers", "/admin/customers");
    expectAllLinksNamed("Quote Submissions", "/admin/quotes");
    expectAllLinksNamed("Placed Orders", "/admin/orders");
    expectAllLinksNamed("Resources", "/admin/resources");
    expectAllLinksNamed("Customer workspace", "/dashboard");
    expect(screen.queryByRole("link", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "RFQ Queue" })).not.toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Customer App" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Project Management" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Request Quote" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Quotes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Materials" })).not.toBeInTheDocument();
  });

  it("persists reordered admin navigation for the current user only", async () => {
    mockUsePathname.mockReturnValue("/admin/quotes");

    render(
      <AppShell sessionRole="admin">
        <div>content</div>
      </AppShell>,
    );

    const draggedData: Record<string, string> = {};
    const dataTransfer = {
      effectAllowed: "move",
      getData: (type: string) => draggedData[type] ?? "",
      setData: (type: string, value: string) => {
        draggedData[type] = value;
      },
    };
    const desktopQuoteSubmissionsLink = screen.getAllByRole("link", { name: "Quote Submissions" })[0];
    const desktopCustomersLink = screen.getAllByRole("link", { name: "Customers" })[0];

    fireEvent.dragStart(desktopQuoteSubmissionsLink, { dataTransfer });
    fireEvent.drop(desktopCustomersLink, { dataTransfer });

    await waitFor(() => {
      expect(window.localStorage.getItem("lattice:sidebar-nav-order:will@latticeos.co:admin")).toBe(
        JSON.stringify({
          Admin: [
            "/admin/customers",
            "/admin/quotes",
            "/admin/vendors",
            "/admin/orders",
            "/admin/material-inquiries",
            "/admin/resources",
          ],
        }),
      );
    });

    const desktopAdminNav = document.querySelector("aside nav section div");

    expect(desktopAdminNav?.textContent).toMatch(/Customers\s*Quote Submissions\s*Overseas Vendors\s*Placed Orders\s*Material Inquiries\s*Resources/);
    expect(desktopAdminNav?.textContent).not.toContain("Overview");
  });

  it("applies saved navigation order after the initial render", async () => {
    window.localStorage.setItem(
      "lattice:sidebar-nav-order:will@latticeos.co:customer",
      JSON.stringify({
        "Your Resources": ["/equipment", "/materials", "/capabilities"],
      }),
    );

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    const customerNav = document.querySelector("aside nav section:nth-child(2) div");

    expect(customerNav?.textContent).toMatch(/Materials\s*Capabilities\s*Equipment\s*Inspection & Certificates/);

    await waitFor(() => {
      expect(customerNav?.textContent).toMatch(/Equipment\s*Materials\s*Capabilities\s*Inspection & Certificates/);
    });
  });

  it("does not render the retired admin overview link on nested admin pages", () => {
    mockUsePathname.mockReturnValue("/admin/customers");

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    const currentLinks = screen.getAllByRole("link", { current: "page" });

    expect(currentLinks.map((link) => link.textContent)).toEqual(["Customers", "Customers"]);
    expect(screen.queryByRole("link", { name: "Overview" })).not.toBeInTheDocument();
  });

  it("allows active parent nav links to return from detail pages", async () => {
    mockUsePathname.mockReturnValue("/quotes/demo_submitted");

    render(
      <AppShell>
        <div>quote detail</div>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("link", { name: "Quotes" })[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/quotes");
    });
  });

  it("clears stale query state when the current nav item is selected", () => {
    mockUsePathname.mockReturnValue("/admin/quotes");
    window.history.pushState({}, "", "/admin/quotes?requestId=req_stale");

    render(
      <AppShell sessionRole="admin">
        <div>quote submissions</div>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("link", { name: "Quote Submissions" })[0]);

    expect(mockReplace).toHaveBeenCalledWith("/admin/quotes", { scroll: false });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens account actions from the sidebar profile menu", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("link", { name: "Account Settings" })).toHaveAttribute("href", "/account/settings");
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });

  it("opens account actions without navigating from the profile card", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("closes account actions when clicking outside the sidebar profile menu", () => {
    render(
      <AppShell>
        <button type="button">Page action</button>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Page action" }));

    expect(screen.queryByRole("button", { name: "Sign Out" })).not.toBeInTheDocument();
  });

  it("links the sidebar profile card to account settings", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /William Paik will@latticeos.co/ })).toHaveAttribute("href", "/account/settings");
  });

  it("returns to the landing page when signing out", () => {
    const windowOpen = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect(windowOpen).toHaveBeenCalledWith("/api/logout", "_self");

    windowOpen.mockRestore();
  });
});
