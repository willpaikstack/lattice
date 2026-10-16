/** Safe address-only shape shared by the lookup route and address editor. */
export type StreetAddressSuggestion = {
  id: string;
  address1: string;
  city: string;
  state: string;
  zipCode: string;
  label: string;
};
