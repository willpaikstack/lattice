import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  requireActionRole: vi.fn(),
  revalidatePath: vi.fn(),
  updateSupplierOrder: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/request-repository", () => ({ updateSupplierOrder: mocks.updateSupplierOrder }));
vi.mock("@/lib/route-authorization", () => ({ requireActionRole: mocks.requireActionRole }));

import { updateSupplierOrderAction } from "./actions";

function validSupplierUpdate() {
  const formData = new FormData();
  formData.set("status", "IN_PRODUCTION");
  formData.set("documentCategory", "PHOTO");
  formData.set("shopName", "Internal supplier record");
  return formData;
}

describe("supplier order action access", () => {
  beforeEach(() => {
    mocks.redirect.mockClear();
    mocks.requireActionRole.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.updateSupplierOrder.mockReset();
  });

  it("does not permit a customer session to update supplier production data", async () => {
    mocks.requireActionRole.mockRejectedValue(new Error("Access denied."));

    await expect(updateSupplierOrderAction("req_owned", validSupplierUpdate())).rejects.toThrow("Access denied.");

    expect(mocks.requireActionRole).toHaveBeenCalledWith(["supplier"]);
    expect(mocks.updateSupplierOrder).not.toHaveBeenCalled();
  });

  it("keeps supplier portal mutations unavailable until a supplier session is deliberately provisioned", async () => {
    mocks.requireActionRole.mockRejectedValue(new Error("Authentication required."));

    await expect(updateSupplierOrderAction("req_owned", validSupplierUpdate())).rejects.toThrow("Authentication required.");

    expect(mocks.updateSupplierOrder).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
