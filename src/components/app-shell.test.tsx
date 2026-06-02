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
    expectAllLinksNamed("Admin", "/admin");
    expect(screen.getByText("Your Resources")).toBeInTheDocument();
    expect(screen.getByText("William Paik")).toBeInTheDocument();
    expect(screen.getByText("will@latticeos.co")).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Project Management" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "RFQ Queue" })).not.toBeInTheDocument();
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

  it("uses admin-only navigation on the admin dashboard", () => {
    mockUsePathname.mockReturnValue("/admin");

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expectAllLinksNamed("Overview", "/admin");
    expectAllLinksNamed("Customers", "/admin/customers");
    expectAllLinksNamed("Quote Submissions", "/admin/quotes");
    expectAllLinksNamed("Placed Orders", "/admin/orders");
    expectAllLinksNamed("Customer App", "/dashboard");
    expect(screen.queryByRole("link", { name: "RFQ Queue" })).not.toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Project Management" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Request Quote" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Quotes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Materials" })).not.toBeInTheDocument();
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
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
