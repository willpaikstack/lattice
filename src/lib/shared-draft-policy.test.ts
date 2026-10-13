import { describe, expect, it } from "vitest";
import { isPreviewDraftId, sharedDraftsFromBrowser } from "./shared-draft-policy";

describe("shared draft policy", () => {
  it("keeps demo/fixture drafts local without dropping genuine drafts", () => {
    const local = { id: "local_draft_real", contents: "unchanged" };
    const input = [{ id: "demo_draft_pump_cover" }, local, { id: "fixture_draft_example" }];
    expect(sharedDraftsFromBrowser(input)).toEqual([local]);
    expect(input).toHaveLength(3);
  });
  it("does not hide malformed customer drafts from server validation", () => {
    expect(sharedDraftsFromBrowser([{ id: "invalid_real_id" }])).toEqual([{ id: "invalid_real_id" }]);
    expect(isPreviewDraftId("local_draft_demo_example")).toBe(false);
  });
});
