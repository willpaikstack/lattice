import type { AccountAddress } from "./account-settings-shared";
import type { RequestBillingSnapshot } from "./request-billing";
import type { LatticeRequest } from "./request-model";

function completeAddress(address: AccountAddress) {
  return [address.name, address.company, address.address1, address.city, address.state, address.zipCode].every((value) => value.trim());
}

/** Display defaults for missing quote addresses without changing stored snapshots. */
export function quoteWithDisplayAddresses(request: LatticeRequest, shipping?: AccountAddress, billing?: RequestBillingSnapshot): LatticeRequest {
  if (request.status === "PURCHASED") return request;
  const savedShippingComplete = Boolean(request.shipToName?.trim() && (request.shipToCompany || request.buyerCompany).trim() && request.shipToAddress1?.trim() && request.shipToCity?.trim() && request.shipToState?.trim() && request.shipToZipCode?.trim());
  const savedBillingComplete = request.billingSnapshot && completeAddress({ ...request.billingSnapshot.address, company: request.billingSnapshot.address.company || request.buyerCompany });
  return {
    ...request,
    ...(!savedShippingComplete && shipping && completeAddress(shipping) ? {
      shipToName: shipping.name,
      shipToCompany: shipping.company,
      shipToAddress1: shipping.address1,
      shipToAddress2: shipping.address2,
      shipToCity: shipping.city,
      shipToState: shipping.state,
      shipToZipCode: shipping.zipCode,
      shipToPhone: shipping.phone ?? "",
    } : {}),
    ...(!savedBillingComplete && billing && completeAddress(billing.address) ? { billingSnapshot: billing } : {}),
  };
}
