/** Synthetic RFQs are local preview data, never shared customer draft records. */
export function isPreviewDraftId(id: unknown): boolean {
  return typeof id === "string" && /^(demo_|fixture_)/.test(id);
}

export function sharedDraftsFromBrowser<T extends { id: string }>(drafts: T[]): T[] {
  return drafts.filter((draft) => !isPreviewDraftId(draft?.id));
}
