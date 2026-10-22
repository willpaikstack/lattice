import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("./waiting-list", () => ({ createWaitingListEntry: mocks.create }));
import { saveCallRequest } from "./call-request";

function request(overrides: Partial<Record<string, string>> = {}) {
  const data = new FormData();
  Object.entries({
    name: " Alex Shop ",
    email: " ALEX@EXAMPLE.COM ",
    company: " Example Machining ",
    needs: "Repeat turned parts",
    phone: "555-555-0100",
    availability: "Mornings, Eastern",
    ...overrides,
  }).forEach(([key, value]) => data.set(key, value ?? ""));
  return data;
}
describe("Call requests", () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.create.mockResolvedValue({ id: "lead-1" });
  });
  it("stores a marked lead in the existing admin queue with contact and timing details", async () => {
    const result = await saveCallRequest(request());
    expect(result.status).toBe("received");
    expect(result.message).toContain("not scheduled yet");
    expect(mocks.create).toHaveBeenCalledWith({
      name: "Alex Shop",
      email: "alex@example.com",
      company: "Example Machining",
      procurementNeeds:
        "CALL REQUEST\nPhone: 555-555-0100\nPreferred times / time zone: Mornings, Eastern\n\nRepeat turned parts",
    });
  });
  it.each([
    { name: " " },
    { email: "invalid" },
    { email: "a\nb@example.com" },
    { company: "" },
    { needs: "" },
    { needs: "x".repeat(3001) },
    { website: "bot.example" },
  ])(
    "rejects invalid or automated input before persistence: %j",
    async (values) => {
      expect((await saveCallRequest(request(values))).status).toBe("error");
      expect(mocks.create).not.toHaveBeenCalled();
    },
  );
  it("accepts omitted optional phone and preferred time", async () => {
    expect(
      (await saveCallRequest(request({ phone: "", availability: "" }))).status,
    ).toBe("received");
    expect(mocks.create.mock.calls[0][0].procurementNeeds).toContain(
      "Arrange by email",
    );
  });
  it("does not claim success or expose database errors after a failed save", async () => {
    mocks.create.mockRejectedValue(new Error("private database detail"));
    const result = await saveCallRequest(request());
    expect(result.status).toBe("error");
    expect(result.message).toContain("try again");
    expect(result.message).not.toContain("private database detail");
  });
});
