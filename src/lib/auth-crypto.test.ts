import { afterEach, describe, expect, it } from "vitest";

import { canRoleAccessPath, defaultHomeForRole, resolveRoleForEmail } from "./auth-crypto";

describe("auth route roles", () => {
  const originalAdminEmails = process.env.LATTICE_ADMIN_EMAILS;
  const originalSupplierEmails = process.env.LATTICE_SUPPLIER_EMAILS;

  afterEach(() => {
    process.env.LATTICE_ADMIN_EMAILS = originalAdminEmails;
    process.env.LATTICE_SUPPLIER_EMAILS = originalSupplierEmails;
  });

  it("maps explicit internal users to admin and supplier roles", () => {
    process.env.LATTICE_ADMIN_EMAILS = "ops@latticeos.co";
    process.env.LATTICE_SUPPLIER_EMAILS = "shop@example.com";

    expect(resolveRoleForEmail("will@latticeos.co")).toBe("admin");
    expect(resolveRoleForEmail("ops@latticeos.co")).toBe("admin");
    expect(resolveRoleForEmail("shop@example.com")).toBe("supplier");
    expect(resolveRoleForEmail("buyer@example.com")).toBe("customer");
  });

  it("allows admins to operate the customer app while keeping other roles isolated", () => {
    expect(canRoleAccessPath("admin", "/admin/quotes")).toBe(true);
    expect(canRoleAccessPath("admin", "/quotes/req_123")).toBe(true);
    expect(canRoleAccessPath("admin", "/requests/new")).toBe(true);
    expect(canRoleAccessPath("admin", "/dashboard")).toBe(true);
    expect(canRoleAccessPath("admin", "/supplier/orders")).toBe(false);

    expect(canRoleAccessPath("customer", "/quotes/req_123")).toBe(true);
    expect(canRoleAccessPath("customer", "/orders/req_123")).toBe(true);
    expect(canRoleAccessPath("customer", "/admin/quotes")).toBe(false);

    expect(canRoleAccessPath("supplier", "/supplier/orders/req_123")).toBe(true);
    expect(canRoleAccessPath("supplier", "/admin/orders")).toBe(false);
    expect(canRoleAccessPath("supplier", "/orders/req_123")).toBe(false);
  });

  it("uses role-specific app homes", () => {
    expect(defaultHomeForRole("admin")).toBe("/admin/quotes");
    expect(defaultHomeForRole("customer")).toBe("/dashboard");
    expect(defaultHomeForRole("supplier")).toBe("/supplier/orders");
  });
});
