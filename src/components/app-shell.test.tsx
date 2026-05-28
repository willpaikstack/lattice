import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

const mockUsePathname = vi.fn(() => "/dashboard");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

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
    expect(screen.getByText("William Paik")).toBeInTheDocument();
    expect(screen.getByText("william.paik@amogy.co")).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Project Management" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "RFQ Queue" })).not.toBeInTheDocument();
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
    expectAllLinksNamed("RFQ Queue", "/operator/requests");
    expectAllLinksNamed("Customer App", "/dashboard");

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
});
