import type { LatticeRequest } from "./request-model";

const submissionDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short", day: "numeric", year: "numeric",
  hour: "numeric", minute: "2-digit", timeZoneName: "short",
});

export function adminSubmissionDate(request: Pick<LatticeRequest, "createdAt" | "statusEvents">) {
  const submittedAt = request.statusEvents.find(event => event.to === "SUBMITTED")?.at ?? request.createdAt;
  const date = new Date(submittedAt);
  return Number.isNaN(date.getTime()) ? "Not recorded" : submissionDateFormatter.format(date);
}

/** Legacy RFQs lack a saved name; match their email within their owning company only. */
export function withAdminSubmitterNames<T extends Pick<LatticeRequest, "requesterName" | "requesterEmail" | "buyerCompanyId">>(requests: T[], companies: Array<{ id: string; users: Array<{ email: string; name: string }> }>) {
  const names = new Map(companies.flatMap(company => company.users.map(user =>
    [`${company.id}\0${user.email.trim().toLowerCase()}`, user.name] as const,
  )));
  return requests.map(request => ({
    ...request,
    requesterName: request.requesterName.trim() || names.get(`${request.buyerCompanyId}\0${request.requesterEmail.trim().toLowerCase()}`) || "",
  }));
}
