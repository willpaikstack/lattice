/** Safe address-only shape shared by the lookup route and address editor. */
export type StreetAddressSuggestion = {
  id: string;
  address1: string;
  city: string;
  state: string;
  zipCode: string;
  label: string;
};

export type StreetLookupFailure = "not_configured" | "credentials" | "quota" | "timeout" | "unavailable";

/** House numbers alone cannot identify a street. */
export function canSearchStreet(text: string) {
  return text.trim().length >= 3 && /\p{L}/u.test(text);
}
