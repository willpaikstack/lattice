import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "./app-shell";

function expectAllLinksNamed(label: string, href: string) {
  const links = screen.getAllByRole("link", { name: label });
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    expect(link).toHaveAttribute("href", href);
  }
}

describe("AppShell", () => {
  it("uses real local routes for Bubble sidebar modules", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expectAllLinksNamed("Analytics", "/analytics");
    expectAllLinksNamed("Project Management", "/projects");
    expectAllLinksNamed("Our Quotes", "/quotes");
    expectAllLinksNamed("Our Orders", "/orders");
    expectAllLinksNamed("Materials", "/materials");
    expectAllLinksNamed("Capabilities", "/capabilities");
  });
});
