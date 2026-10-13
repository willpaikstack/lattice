import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import EquipmentExplorerPage from "./page";

describe("EquipmentExplorerPage access", () => {
  it("redirects anonymous sessions to login", async () => {
    mocks.session.mockResolvedValue(null);
    await expect(EquipmentExplorerPage()).rejects.toThrow("redirect:/login?redirect_url=%2Fequipment-explorer");
  });
  it("keeps suppliers in their workspace", async () => {
    mocks.session.mockResolvedValue({ user: { role: "supplier" } });
    await expect(EquipmentExplorerPage()).rejects.toThrow("redirect:/supplier/orders");
  });
  it.each(["admin", "customer"])("allows %s to browse", async role => {
    mocks.session.mockResolvedValue({ user: { role } });
    expect((await EquipmentExplorerPage()).props.equipment).toHaveLength(150);
  });
});
