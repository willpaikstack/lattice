import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAccountSettings } from "@/lib/account-settings-shared";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), clerkClient: vi.fn(), updateUser: vi.fn(), syncName: vi.fn(), findUser: vi.fn(), getSession: vi.fn(), saveSettings: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth, clerkClient: mocks.clerkClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/workspace-user", () => ({ findWorkspaceUserByClerkUserId: mocks.findUser, syncWorkspaceUserName: mocks.syncName }));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.getSession }));
vi.mock("@/lib/account-settings", () => ({ saveAccountSettings: mocks.saveSettings, deferInitialAddressOnboarding: vi.fn() }));
import { saveAccountSettingsAction, updateAccountDisplayNameAction } from "./actions";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: "clerk-actor" });
  mocks.clerkClient.mockResolvedValue({ users: { updateUser: mocks.updateUser } });
  mocks.getSession.mockResolvedValue({ user: { id: "workspace-actor" } });
  mocks.updateUser.mockResolvedValue({ fullName: "Updated Buyer" });
  mocks.syncName.mockResolvedValue({});
});
describe("account settings server actions", () => {
  it("synchronizes a name to Clerk and the authenticated database user, then refreshes the shared layout", async () => {
    await expect(updateAccountDisplayNameAction("Updated Buyer")).resolves.toEqual({ name: "Updated Buyer" });
    expect(mocks.updateUser).toHaveBeenCalledWith("clerk-actor", { firstName: "Updated", lastName: "Buyer" });
    expect(mocks.syncName).toHaveBeenCalledWith("workspace-actor", "Updated Buyer");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
  it("rejects a failed database name write without reporting success", async () => {
    mocks.syncName.mockRejectedValueOnce(new Error("Database unavailable"));
    await expect(updateAccountDisplayNameAction("Updated Buyer")).rejects.toThrow("Database unavailable");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it("rejects signed-out and support-session identity edits", async () => {
    mocks.auth.mockResolvedValueOnce({ userId: null });
    await expect(updateAccountDisplayNameAction("Updated Buyer")).rejects.toThrow("Authentication required");
    mocks.getSession.mockResolvedValueOnce({ user: { supportAdmin: { id: "operator" } } });
    await expect(updateAccountDisplayNameAction("Updated Buyer")).rejects.toThrow("support session");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("rejects credential/payment changes through the settings action and forwards only allowed field groups", async () => {
    const settings = defaultAccountSettings();
    await expect(saveAccountSettingsAction(settings, "stripeCustomerId" as "phone")).rejects.toThrow("valid setting");
    mocks.saveSettings.mockResolvedValue(settings);
    await expect(saveAccountSettingsAction(settings, "phone")).resolves.toEqual(settings);
    expect(mocks.saveSettings).toHaveBeenCalledWith(settings, "phone");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
