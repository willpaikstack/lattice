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
  });

  it("leaves the public landing page outside the app shell", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <AppShell>
        <div>landing content</div>
      </AppShell>,
    );

    expect(screen.getByText("landing content")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(screen.queryByText("William Paik")).not.toBeInTheDocument();
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
    expectAllLinksNamed("Materials", "/materials");
    expectAllLinksNamed("Capabilities", "/capabilities");
    expect(screen.getAllByText("Your Resources").length).toBeGreaterThan(0);
    expect(screen.getByText("William Paik")).toBeInTheDocument();
    expect(screen.getByText("will@latticeos.co")).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Project Management" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "RFQ Queue" })).not.toBeInTheDocument();
  });

  it("lets admin sessions return to the admin workspace from customer routes", () => {
    render(
      <AppShell sessionRole="admin">
        <div>customer content</div>
      </AppShell>,
    );

    expectAllLinksNamed("Admin workspace", "/admin");
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
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

  it("uses admin-only navigation on the admin dashboard", () => {
    mockUsePathname.mockReturnValue("/admin");

    render(
      <AppShell sessionRole="admin">
        <div>content</div>
      </AppShell>,
    );

    expectAllLinksNamed("Overview", "/admin");
    expectAllLinksNamed("Lattice admin home", "/admin");
    expectAllLinksNamed("Customers", "/admin/customers");
    expectAllLinksNamed("Quote Submissions", "/admin/quotes");
    expectAllLinksNamed("Placed Orders", "/admin/orders");
    expectAllLinksNamed("Resources", "/admin/resources");
    expectAllLinksNamed("Customer workspace", "/dashboard");
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
            "/admin",
            "/admin/quotes",
            "/admin/customers",
            "/admin/vendors",
            "/admin/orders",
            "/admin/resources",
          ],
        }),
      );
    });

    const desktopAdminNav = document.querySelector("aside nav section div");

    expect(desktopAdminNav?.textContent).toMatch(/Overview\s*Quote Submissions\s*Customers\s*Overseas Vendors\s*Placed Orders\s*Resources/);
  });

  it("keeps the admin overview link inactive on nested admin pages", () => {
    mockUsePathname.mockReturnValue("/admin/customers");

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    const currentLinks = screen.getAllByRole("link", { current: "page" });

    expect(currentLinks.map((link) => link.textContent)).toEqual(["Customers", "Customers"]);
    for (const link of screen.getAllByRole("link", { name: "Overview" })) {
      expect(link).not.toHaveAttribute("aria-current");
    }
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
